import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { FetchFailure, fetchQuery, fetchWithPolicy, mirrorUrl, receiptUrl, retryDelayMs, verifyLaterReceipt } from './fetch-donki.mjs';

const original = {
  retrievedAt: '2026-11-14T18:41:31.405Z',
  sha256: 'ab'.repeat(32),
  recordCount: 1,
  url: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR',
};

const asFetch = (impl: unknown) => impl as typeof fetch;

function jsonResponse(body: string, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    text: async () => body,
  };
}

describe('DONKI fetch policy', () => {
  it('waits the full Retry-After seconds and does not cap a long delay', () => {
    expect(retryDelayMs('120', 0)).toBe(120_000);
  });

  it('waits until an HTTP-date Retry-After, and not earlier', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    expect(retryDelayMs('Sun, 15 Nov 2026 12:00:30 GMT', now)).toBe(30_000);
  });

  it('does not sleep after the final 429 or 500', async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi.fn(async () => jsonResponse('[]', 429, { 'retry-after': '120' }));
    await expect(fetchQuery('https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', { fetchImpl: asFetch(fetchImpl), retries: 1, sleep, deadlineMs: 500_000 })).rejects.toMatchObject({ kind: 'rate-limited' });
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(120_000);
  });

  it('rejects a JSON array served as text/html and a JSON array with no JSON type', async () => {
    const html = async () => jsonResponse('[]', 200, { 'content-type': 'text/html' });
    const plain = async () => jsonResponse('[]', 200, { 'content-type': 'text/plain' });
    await expect(fetchQuery('https://example.test/FLR', { fetchImpl: asFetch(html), retries: 0 })).rejects.toMatchObject({ kind: 'html' });
    await expect(fetchQuery('https://example.test/FLR', { fetchImpl: asFetch(plain), retries: 0 })).rejects.toMatchObject({ kind: 'mime' });
  });

  it('aborts a stalled body', async () => {
    const fetchImpl = async (_url: string, init: { signal: AbortSignal }) => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }),
    });
    await expect(fetchQuery('https://example.test/FLR', { fetchImpl: asFetch(fetchImpl), timeoutMs: 20, retries: 0 })).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('stops when Retry-After would pass the overall deadline', async () => {
    const fetchImpl = async () => jsonResponse('[]', 503, { 'retry-after': '120' });
    await expect(fetchQuery('https://example.test/FLR', { fetchImpl: asFetch(fetchImpl), retries: 1, deadlineMs: 1000, sleep: async () => undefined })).rejects.toMatchObject({ kind: 'deadline' });
  });

  it('uses the public mirror only after an opted-in primary failure and strips the key', async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      if (url.includes('ccmc.gsfc.nasa.gov')) return jsonResponse('[]', 503, { 'retry-after': '0' });
      return jsonResponse('[]', 200, { 'content-type': 'application/json' });
    };
    const primary = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-09&endDate=2024-05-11';
    const result = await fetchWithPolicy(primary, { fetchImpl: asFetch(fetchImpl), allowMirror: true, retries: 0, sleep: async () => undefined });
    expect(calls[1]).toContain('api_key=DEMO_KEY');
    expect(result.url).not.toContain('api_key');
    expect(result.verification).toBe('later-verification');
    expect(mirrorUrl(primary)).toContain('https://api.nasa.gov/DONKI/get/FLR');
    expect(receiptUrl(mirrorUrl(primary)!)).not.toContain('api_key');
  });

  it('does not mirror when the caller did not allow it', async () => {
    const fetchImpl = async () => jsonResponse('nope', 404);
    await expect(fetchWithPolicy('https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', { fetchImpl: asFetch(fetchImpl), retries: 0 })).rejects.toBeInstanceOf(FetchFailure);
  });

  it('checks the raw body hash and refuses an original-acquisition label', () => {
    const body = '[]';
    const sha256 = createHash('sha256').update(body).digest('hex');
    const meta = {
      sha256,
      bytes: Buffer.byteLength(body),
      contentType: 'application/json',
      verification: 'later-verification',
      url: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR',
      retrievedAt: '2026-11-15T11:00:00Z',
      recordCount: 0,
      httpStatus: 200,
    };
    expect(verifyLaterReceipt(body, meta, original).ok).toBe(true);
    expect(verifyLaterReceipt(body, meta, original).drift).toBe(true);
    expect(verifyLaterReceipt(body, { ...meta, sha256: '0'.repeat(64) }, original)).toMatchObject({ ok: false, reason: 'body-hash' });
    expect(verifyLaterReceipt(body, { ...meta, verification: 'original-acquisition' }, original)).toMatchObject({ ok: false, reason: 'label' });
    expect(verifyLaterReceipt(body, { ...meta, url: 'https://api.nasa.gov/DONKI/get/FLR?api_key=DEMO_KEY' }, original)).toMatchObject({ ok: false, reason: 'key' });
    expect(verifyLaterReceipt(body, { ...meta, recordCount: 999 }, original)).toMatchObject({ ok: false, reason: 'count' });
    expect(verifyLaterReceipt(body, { ...meta, httpStatus: 500 }, original)).toMatchObject({ ok: false, reason: 'status' });
    expect(verifyLaterReceipt(body, { ...meta, url: 'https://example.test/FLR' }, original)).toMatchObject({ ok: false, reason: 'endpoint' });
    expect(verifyLaterReceipt(body, { ...meta, url: 'https://api.nasa.gov/DONKI/get/FLR' }, original).ok).toBe(true);
    const swapped = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?endDate=2024-05-11&startDate=2024-05-09';
    const ordered = {
      ...meta,
      url: 'https://api.nasa.gov/DONKI/get/FLR?startDate=2024-05-09&endDate=2024-05-11',
    };
    const canonical = { ...original, url: swapped };
    expect(verifyLaterReceipt(body, ordered, canonical).ok).toBe(true);
    expect(verifyLaterReceipt(body, { ...meta, url: meta.url.replace('https:', 'http:') }, original).ok).toBe(false);
    expect(verifyLaterReceipt(body, { ...meta, url: 'https://ccmc.gsfc.nasa.gov:444/DONKI-API/get/FLR' }, original).ok).toBe(false);
    expect(verifyLaterReceipt(body, { ...meta, url: 'https://fake:fake@ccmc.gsfc.nasa.gov/DONKI-API/get/FLR' }, original).ok).toBe(false);
    expect(verifyLaterReceipt(body, { ...meta, url: `${meta.url}?startDate=2024-05-09&startDate=1900-01-01` }, original).ok).toBe(false);
    expect(verifyLaterReceipt(body, { ...meta, contentType: 'application/jsonp' }, original)).toMatchObject({ ok: false, reason: 'mime' });
    expect(verifyLaterReceipt(body, { ...meta, contentType: 'application/json; charset=utf-8' }, original).ok).toBe(true);
    expect(verifyLaterReceipt(body, { ...meta, retrievedAt: '2027-02-30T00:00:00Z' }, original)).toMatchObject({ ok: false, reason: 'date' });
    const invalid = Buffer.concat([Buffer.from('["'), Buffer.from([255]), Buffer.from('"]')]);
    const decoded = invalid.toString('utf8');
    expect(
      verifyLaterReceipt(invalid, { ...meta, sha256: createHash('sha256').update(decoded).digest('hex'), bytes: Buffer.byteLength(decoded), recordCount: 1 }, original).ok,
    ).toBe(false);
  });

  it('rejects a valid body that arrives after the shared deadline', async () => {
    let clock = 0;
    const fetchImpl = async () => {
      clock = 1000;
      return jsonResponse('[]', 200, { 'content-type': 'application/json' });
    };
    await expect(fetchQuery('https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', { fetchImpl: asFetch(fetchImpl), retries: 0, deadlineMs: 100, now: () => clock })).rejects.toMatchObject({ kind: 'deadline' });
  });

  it('does not give the mirror a fresh deadline', async () => {
    let clock = 0;
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      if (url.includes('ccmc.gsfc.nasa.gov')) {
        clock = 80;
        return jsonResponse('[]', 503, { 'retry-after': '0' });
      }
      clock = 500;
      return jsonResponse('[]', 200, { 'content-type': 'application/json' });
    };
    const primary = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-09&endDate=2024-05-11';
    await expect(
      fetchWithPolicy(primary, { fetchImpl: asFetch(fetchImpl), allowMirror: true, retries: 0, deadlineMs: 100, now: () => clock, sleep: async () => undefined }),
    ).rejects.toMatchObject({ kind: 'deadline' });
    expect(calls).toHaveLength(2);
  });
});
