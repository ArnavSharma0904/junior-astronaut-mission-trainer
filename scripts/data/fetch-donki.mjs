// Explicitly run acquisition script: `npm run data:fetch`. Never part of build, tests or the app.
// Re-fetches the exact DONKI queries recorded in the committed snapshot, saves the raw bodies under the
// git-ignored .agent-bus/evidence/data/ folder and reports status, content type, size and SHA-256.
// No API key is used or needed for the CCMC endpoint.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DONKI_HOSTS = new Set(['ccmc.gsfc.nasa.gov', 'api.nasa.gov']);

function canonicalDonkiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;
  if (!DONKI_HOSTS.has(url.hostname)) return null;
  const allowedPath = url.hostname === 'api.nasa.gov' ? /^\/DONKI\/get\/[^/]+\/?$/ : /^\/DONKI-API\/get\/[^/]+\/?$/;
  if (!allowedPath.test(url.pathname)) return null;
  for (const key of new Set(url.searchParams.keys())) {
    if (url.searchParams.getAll(key).length > 1) return null;
  }
  return url;
}

/** A real UTC calendar timestamp. Date.parse must not be allowed to roll 2027-02-30 into March. */
export function isRealUtcTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?Z$/.exec(String(value ?? ''));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** CCMC and the public api.nasa.gov mirror are the same DONKI route when the path and query match. */
export function sameDonkiQuery(actualUrl, expectedUrl) {
  const actual = canonicalDonkiUrl(actualUrl);
  const expected = canonicalDonkiUrl(expectedUrl);
  if (!actual || !expected) return false;
  const route = (url) => url.pathname.replace(/^\/(?:DONKI-API|DONKI)\/get\//, '').replace(/\/$/, '');
  if (route(actual) !== route(expected)) return false;
  const entries = (url) => [...url.searchParams.entries()].filter(([key]) => key !== 'api_key').sort((left, right) => left[0].localeCompare(right[0]) || left[1].localeCompare(right[1]));
  const left = entries(actual);
  const right = entries(expected);
  return left.length === right.length && left.every((pair, index) => pair[0] === right[index][0] && pair[1] === right[index][1]);
}

function routeFromUrl(url) {
  const parsed = canonicalDonkiUrl(url);
  if (!parsed) return null;
  const name = parsed.pathname.split('/').filter(Boolean).at(-1);
  if (name === 'FLR') return 'flr';
  if (name === 'SEP') return 'sep';
  if (name === 'CME') return 'cme';
  if (name === 'WSAEnlilSimulations') return 'enlil';
  return null;
}

const ROUTE_FIELDS = {
  flr: ['flrID', 'beginTime', 'peakTime', 'endTime', 'classType', 'instruments'],
  sep: ['sepID', 'eventTime', 'instruments'],
  cme: ['activityID', 'startTime'],
  enlil: ['simulationID', 'modelCompletionTime'],
};

/** Empty arrays are legitimate. A non-empty body must carry the fields that route's records use. */
export function routeBodyMatches(url, parsed) {
  if (!Array.isArray(parsed)) return false;
  if (parsed.length === 0) return true;
  const route = routeFromUrl(url);
  const fields = route ? ROUTE_FIELDS[route] : null;
  if (!fields) return false;
  return parsed.every((row) => row && typeof row === 'object' && !Array.isArray(row) && fields.every((field) => row[field] != null && row[field] !== ''));
}

/**
 * A later download must hash to its own receipt and must not be labeled as the original raw body.
 * The body array length, HTTP 200, and the canonical query are required. A different hash is drift, not a failure.
 */
export function verifyLaterReceipt(body, meta, original) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== meta.sha256) return { ok: false, reason: 'body-hash' };
  if (bytes.length !== meta.bytes) return { ok: false, reason: 'bytes' };
  const media = String(meta.contentType ?? '').split(';')[0].trim().toLowerCase();
  if (media !== 'application/json') return { ok: false, reason: 'mime' };
  if (meta.verification !== 'later-verification') return { ok: false, reason: 'label' };
  if (String(meta.url ?? '').includes('api_key')) return { ok: false, reason: 'key' };
  if (meta.httpStatus !== 200) return { ok: false, reason: 'status' };
  if (!sameDonkiQuery(meta.url, original.url)) return { ok: false, reason: 'endpoint' };
  if (!isRealUtcTimestamp(meta.retrievedAt) || !isRealUtcTimestamp(original.retrievedAt)) return { ok: false, reason: 'date' };
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, reason: 'encoding' };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!Array.isArray(parsed)) return { ok: false, reason: 'schema' };
  if (!routeBodyMatches(meta.url, parsed)) return { ok: false, reason: 'schema' };
  if (meta.recordCount !== parsed.length) return { ok: false, reason: 'count' };
  if (!(Date.parse(meta.retrievedAt) > Date.parse(original.retrievedAt))) return { ok: false, reason: 'date' };
  return { ok: true, drift: sha256 !== original.sha256 || meta.recordCount !== original.recordCount };
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
export async function fetchQuery(url, { fetchImpl = fetch, timeoutMs = 20000, retries = 2, deadlineMs = 90000, deadlineAt, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() } = {}) {
  const endAt = deadlineAt ?? now() + deadlineMs;
  const remaining = () => endAt - now();
  let lastFailure;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (remaining() <= 0) throw new FetchFailure('Overall deadline exceeded', 'deadline');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, remaining()));
    try {
      const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (response.status === 429 || response.status >= 500) {
        lastFailure = new FetchFailure(`HTTP ${response.status}`, response.status === 429 ? 'rate-limited' : 'server-error');
        if (attempt === retries) break;
        const requested = retryDelayMs(response.headers.get('retry-after'), now());
        const wait = requested == null ? Math.min(1000 * 2 ** attempt, 8000) : requested;
        if (now() + wait > endAt) throw new FetchFailure('Retry-After exceeds the deadline', 'deadline');
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new FetchFailure(`HTTP ${response.status}`, 'http-error');
      const contentType = response.headers.get('content-type') ?? '';
      if (/text\/html/i.test(contentType)) throw new FetchFailure('HTML returned instead of JSON', 'html');
      if (!/application\/json/i.test(contentType)) throw new FetchFailure(`MIME is not JSON (${contentType || 'missing'})`, 'mime');
      const body = await response.text();
      if (now() > endAt) throw new FetchFailure('Overall deadline exceeded', 'deadline');
      if (body.trimStart().startsWith('<')) throw new FetchFailure('HTML returned instead of JSON', 'html');
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new FetchFailure('Body is not valid JSON', 'malformed');
      }
      if (!Array.isArray(parsed)) throw new FetchFailure('Body is not a JSON array', 'malformed');
      if (!routeBodyMatches(url, parsed)) throw new FetchFailure('Records do not match this DONKI route', 'schema');
      return {
        url: receiptUrl(url),
        httpStatus: response.status,
        contentType,
        bytes: Buffer.byteLength(body),
        sha256: createHash('sha256').update(Buffer.from(body)).digest('hex'),
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
  const now = options.now ?? (() => Date.now());
  const endAt = options.deadlineAt ?? now() + (options.deadlineMs ?? 90000);
  const shared = { ...options, deadlineAt: endAt, now };
  try {
    return await fetchQuery(url, shared);
  } catch (error) {
    const retryable = error instanceof FetchFailure && ['rate-limited', 'server-error', 'timeout', 'network'].includes(error.kind);
    const mirror = options.allowMirror ? mirrorUrl(url) : null;
    if (!retryable || !mirror) throw error;
    if (now() >= endAt) throw new FetchFailure('Overall deadline exceeded', 'deadline');
    return fetchQuery(mirror, { ...shared, retries: 0 });
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
      console.log(`${query.id}: HTTP ${meta.httpStatus} ${meta.contentType} ${meta.bytes} bytes, ${meta.recordCount} records, sha256 ${meta.sha256} ${same ? '(matches snapshot query hash)' : '(DIFFERS from the packaged query hash; the curated snapshot was not overwritten. npm run data:validate checks the tracked fixtures, not this download.)'}`);
    } catch (error) {
      failed = true;
      console.error(`${query.id}: BLOCKED (${error.kind ?? 'error'}) ${error.message}. Nothing was invented; the committed snapshot is unchanged.`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
