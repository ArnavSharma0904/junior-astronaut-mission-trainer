// Explicitly run acquisition script: `npm run data:fetch`. Never part of build, tests or the app.
// Re-fetches the exact DONKI queries recorded in the committed snapshot, saves the raw bodies under the
// git-ignored .agent-bus/evidence/data/ folder and reports status, content type, size and SHA-256.
// No API key is used or needed for the CCMC endpoint.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** A later download must hash to its own receipt and must not be labeled as the original raw body. */
export function verifyLaterReceipt(body, meta, original) {
  const sha256 = createHash('sha256').update(body).digest('hex');
  const bytes = Buffer.byteLength(body);
  if (sha256 !== meta.sha256) return { ok: false, reason: 'body-hash' };
  if (bytes !== meta.bytes) return { ok: false, reason: 'bytes' };
  if (!String(meta.contentType ?? '').toLowerCase().includes('application/json')) return { ok: false, reason: 'mime' };
  if (meta.verification !== 'later-verification') return { ok: false, reason: 'label' };
  if (String(meta.url ?? '').includes('api_key')) return { ok: false, reason: 'key' };
  if (!(Date.parse(meta.retrievedAt) > Date.parse(original.retrievedAt))) return { ok: false, reason: 'date' };
  if (meta.recordCount !== undefined && meta.recordCount !== original.recordCount && meta.recordCount < 0) return { ok: false, reason: 'count' };
  return { ok: true, drift: sha256 !== original.sha256 };
}

export class FetchFailure extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind;
  }
}

/** Wait requested by a 429/5xx response. Seconds and HTTP-dates are honored. A missing header uses backoff. */
export function retryDelayMs(header, nowMs) {
  if (header == null || header === '') return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const when = Date.parse(header);
  if (Number.isFinite(when)) return Math.max(0, when - nowMs);
  return null;
}

/** Public DEMO_KEY mirror. Not used unless a caller opts in after the CCMC request fails. */
export function mirrorUrl(primaryUrl) {
  const url = new URL(primaryUrl);
  if (url.hostname !== 'ccmc.gsfc.nasa.gov') return null;
  const path = url.pathname.replace('/DONKI-API/', '/DONKI/');
  const next = new URL(`https://api.nasa.gov${path}`);
  url.searchParams.forEach((value, key) => next.searchParams.set(key, value));
  next.searchParams.set('api_key', 'DEMO_KEY');
  return next.toString();
}

/** Receipts keep the query and drop any key, public or otherwise. */
export function receiptUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete('api_key');
  return parsed.toString();
}

/**
 * Fetches one query with a hard timeout, a stalled-body abort, and bounded retries on 429 and 5xx.
 * Returns the raw body untouched. Throws FetchFailure for timeouts, HTTP errors, wrong MIME and non-array JSON.
 * An empty array is a valid empty result. The last attempt does not sleep. Retry-After is not shortened.
 */
export async function fetchQuery(url, { fetchImpl = fetch, timeoutMs = 20000, retries = 2, deadlineMs = 90000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() } = {}) {
  const started = now();
  let lastFailure;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (now() - started > deadlineMs) throw new FetchFailure('Overall deadline exceeded', 'deadline');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (response.status === 429 || response.status >= 500) {
        lastFailure = new FetchFailure(`HTTP ${response.status}`, response.status === 429 ? 'rate-limited' : 'server-error');
        if (attempt === retries) break;
        const requested = retryDelayMs(response.headers.get('retry-after'), now());
        const wait = requested == null ? Math.min(1000 * 2 ** attempt, 8000) : requested;
        if (now() + wait - started > deadlineMs) throw new FetchFailure('Retry-After exceeds the deadline', 'deadline');
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new FetchFailure(`HTTP ${response.status}`, 'http-error');
      const contentType = response.headers.get('content-type') ?? '';
      if (/text\/html/i.test(contentType)) throw new FetchFailure('HTML returned instead of JSON', 'html');
      if (!/application\/json/i.test(contentType)) throw new FetchFailure(`MIME is not JSON (${contentType || 'missing'})`, 'mime');
      const body = await response.text();
      if (body.trimStart().startsWith('<')) throw new FetchFailure('HTML returned instead of JSON', 'html');
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new FetchFailure('Body is not valid JSON', 'malformed');
      }
      if (!Array.isArray(parsed)) throw new FetchFailure('Body is not a JSON array', 'malformed');
      return {
        url: receiptUrl(url),
        httpStatus: response.status,
        contentType,
        bytes: Buffer.byteLength(body),
        sha256: createHash('sha256').update(body).digest('hex'),
        retrievedAt: new Date(now()).toISOString(),
        recordCount: parsed.length,
        verification: 'later-verification',
        body,
      };
    } catch (error) {
      if (error instanceof FetchFailure) throw error;
      lastFailure = new FetchFailure(error?.name === 'AbortError' ? `Timed out after ${timeoutMs} ms` : `Network error: ${error?.message ?? error}`, error?.name === 'AbortError' ? 'timeout' : 'network');
      if (attempt === retries) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastFailure;
}

/**
 * CCMC first. The public mirror runs only when allowMirror is true and the primary failed
 * for a rate limit, server error, timeout, or network drop. A 404 does not switch hosts.
 */
export async function fetchWithPolicy(url, options = {}) {
  try {
    return await fetchQuery(url, options);
  } catch (error) {
    const retryable = error instanceof FetchFailure && ['rate-limited', 'server-error', 'timeout', 'network'].includes(error.kind);
    const mirror = options.allowMirror ? mirrorUrl(url) : null;
    if (!retryable || !mirror) throw error;
    return fetchQuery(mirror, { ...options, retries: 0 });
  }
}

async function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const snapshot = JSON.parse(await readFile(`${root}src/data/donki-snapshot.json`, 'utf8'));
  const outDir = `${root}.agent-bus/evidence/data`;
  await mkdir(outDir, { recursive: true });
  let failed = false;
  for (const query of snapshot.queries) {
    try {
      const result = await fetchQuery(query.url);
      const { body, ...meta } = result;
      await writeFile(`${outDir}/${query.id}.raw.json`, body);
      await writeFile(`${outDir}/${query.id}.meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
      const same = meta.sha256 === query.sha256;
      console.log(`${query.id}: HTTP ${meta.httpStatus} ${meta.contentType} ${meta.bytes} bytes, ${meta.recordCount} records, sha256 ${meta.sha256} ${same ? '(matches snapshot)' : '(DIFFERS from snapshot: DONKI may have revised records; run npm run data:validate)'}`);
    } catch (error) {
      failed = true;
      console.error(`${query.id}: BLOCKED (${error.kind ?? 'error'}) ${error.message}. Nothing was invented; the committed snapshot is unchanged.`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
