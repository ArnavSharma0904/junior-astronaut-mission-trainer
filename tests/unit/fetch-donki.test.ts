import { describe, expect, it } from 'vitest';
import { FetchFailure, fetchQuery } from '../../scripts/data/fetch-donki.mjs';

// The acquisition script is the only code that touches the network. These tests use a fake fetch: no real request is made.
const response = (status: number, body: string, headers: Record<string, string> = { 'content-type': 'application/json' }) =>
  new Response(body, { status, headers });
const noSleep = async () => {};
const url = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-09&endDate=2024-05-11&class=X';

describe('DONKI acquisition script', () => {
  it('returns the raw body with status, size and hash', async () => {
    const body = '[{"flrID":"x"}]';
    const result = await fetchQuery(url, { fetchImpl: async () => response(200, body), sleep: noSleep });
    expect(result).toMatchObject({ httpStatus: 200, contentType: 'application/json', bytes: body.length, recordCount: 1, body });
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('accepts an empty array as a valid empty result', async () => {
    const result = await fetchQuery(url, { fetchImpl: async () => response(200, '[]'), sleep: noSleep });
    expect(result.recordCount).toBe(0);
  });

  it('retries after 429 and 500, then succeeds', async () => {
    const replies = [response(429, 'slow down', { 'retry-after': '1' }), response(500, 'oops'), response(200, '[]')];
    let calls = 0;
    const result = await fetchQuery(url, { fetchImpl: async () => replies[calls++]!, sleep: noSleep });
    expect(calls).toBe(3);
    expect(result.httpStatus).toBe(200);
  });

  it('gives up after bounded retries and reports the kind of failure', async () => {
    let calls = 0;
    const attempt = fetchQuery(url, { fetchImpl: async () => { calls += 1; return response(429, ''); }, sleep: noSleep, retries: 2 });
    await expect(attempt).rejects.toMatchObject({ kind: 'rate-limited' });
    expect(calls).toBe(3);
  });

  it('times out instead of hanging', async () => {
    const never: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, rejectPromise) => {
        init?.signal?.addEventListener('abort', () => rejectPromise(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      });
    await expect(fetchQuery(url, { fetchImpl: never, timeoutMs: 20, retries: 0, sleep: noSleep })).rejects.toMatchObject({ kind: 'timeout' });
  });

  it.each([
    ['an HTML page', () => response(200, '<html>maintenance</html>', { 'content-type': 'text/html' }), 'html'],
    ['malformed JSON', () => response(200, '[{'), 'malformed'],
    ['a non-array payload', () => response(200, '{"error":"x"}'), 'malformed'],
    ['a 404', () => response(404, 'nope'), 'http-error'],
  ])('rejects %s without inventing data', async (_label, makeReply, kind) => {
    await expect(fetchQuery(url, { fetchImpl: async () => makeReply(), sleep: noSleep })).rejects.toBeInstanceOf(FetchFailure);
    await expect(fetchQuery(url, { fetchImpl: async () => makeReply(), sleep: noSleep })).rejects.toMatchObject({ kind });
  });
});
