// Explicitly run acquisition script: `npm run data:fetch`. Never part of build, tests or the app.
// Re-fetches the exact DONKI queries recorded in the committed snapshot, saves the raw bodies under the
// git-ignored .agent-bus/evidence/data/ folder and reports status, content type, size and SHA-256.
// No API key is used or needed for the CCMC endpoint.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export class FetchFailure extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind;
  }
}

/**
 * Fetches one query with a hard timeout and bounded retries on 429 and 5xx.
 * Returns the raw body untouched. Throws FetchFailure for timeouts, HTTP errors, HTML pages and non-array JSON.
 * An empty array is returned as a valid, empty result: it is never replaced by invented data.
 */
export async function fetchQuery(url, { fetchImpl = fetch, timeoutMs = 20000, retries = 2, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  let lastFailure;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (response.status === 429 || response.status >= 500) {
        lastFailure = new FetchFailure(`HTTP ${response.status}`, response.status === 429 ? 'rate-limited' : 'server-error');
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 1000 * 2 ** attempt);
        continue;
      }
      if (!response.ok) throw new FetchFailure(`HTTP ${response.status}`, 'http-error');
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
        url,
        httpStatus: response.status,
        contentType: response.headers.get('content-type') ?? '',
        bytes: Buffer.byteLength(body),
        sha256: createHash('sha256').update(body).digest('hex'),
        retrievedAt: new Date().toISOString(),
        recordCount: parsed.length,
        body,
      };
    } catch (error) {
      if (error instanceof FetchFailure) throw error;
      lastFailure = new FetchFailure(error?.name === 'AbortError' ? `Timed out after ${timeoutMs} ms` : `Network error: ${error?.message ?? error}`, error?.name === 'AbortError' ? 'timeout' : 'network');
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastFailure;
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
