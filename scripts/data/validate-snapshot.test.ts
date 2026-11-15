import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeCmes, normalizeEnlil, normalizeFlares, normalizeSeps, parseDonkiBody } from '../../src/adapters/donki';
import { snapshot } from '../../src/data';
import osd476 from '../../src/data/osd476-verification.json' with { type: 'json' };
import { verifyLaterReceipt } from './fetch-donki.mjs';

// Rebuilds the snapshot events from raw DONKI bodies saved by `npm run data:fetch` and compares them
// with the committed snapshot. Run on a machine that can reach NASA: `npm run data:fetch && npm run data:validate`.
const dir = '.agent-bus/evidence/data';
const raw = (id: string) => parseDonkiBody(readFileSync(`${dir}/${id}.raw.json`, 'utf8'));
const committed = (type: string) => snapshot.events.filter((event) => event.type === type);
const haveRaw = ['flr', 'sep', 'cme', 'enlil'].every((id) => existsSync(`${dir}/${id}.raw.json`));

describe.skipIf(!haveRaw)('committed snapshot matches freshly fetched raw DONKI responses', () => {
  it('flares', () => expect(normalizeFlares(raw('flr'), 'flr')).toEqual(committed('FLR')));
  it('particle events', () => expect(normalizeSeps(raw('sep'), 'sep', ['2024-05-11T01:10:00-FLR-001'])).toEqual(committed('SEP')));
  it('coronal mass ejections', () =>
    expect(normalizeCmes(raw('cme'), 'cme', ['2024-05-09T09:24:00-CME-001', '2024-05-11T01:36:00-CME-001'])).toEqual(committed('CME')));
  it('WSA-ENLIL model runs', () => expect(normalizeEnlil(raw('enlil'), 'enlil', '2024-05-09T09:24')).toEqual(committed('ENLIL')));
});

describe('committed snapshot metadata, without pretending the original raw bodies are here', () => {
  it('keeps the 19 curated records and the original query hashes', () => {
    expect(snapshot.events).toHaveLength(19);
    expect(snapshot.tool).toMatch(/Raw bodies were not written to disk/);
    for (const query of snapshot.queries) {
      expect(query.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(query.bytes).toBeGreaterThan(0);
      expect(query.contentType).toContain('application/json');
      expect(query.url).toContain('https://ccmc.gsfc.nasa.gov/DONKI-API/');
      expect(query.url).not.toContain('api_key');
      expect(query.recordCount).toBeGreaterThan(0);
      expect(query.retrievedAt.startsWith('2026-11-14')).toBe(true);
    }
    const counts = snapshot.events.reduce<Record<string, number>>((total, event) => {
      total[event.type] = (total[event.type] ?? 0) + 1;
      return total;
    }, {});
    expect(counts).toEqual({ FLR: 5, SEP: 8, CME: 2, ENLIL: 4 });
  });

  it('pins the later OSD-476 receipt and does not store that response body', () => {
    expect(osd476.verification).toBe('later-verification');
    expect(osd476.notOriginalAcquisition).toBe(true);
    expect(osd476.bytes).toBe(15068);
    expect(osd476.sha256).toBe('a6d16e63e419f426c4d2fb63f22ace51c47f486fdb8ea29de00b447db3c3f454');
    expect(osd476.contentType).toBe('application/json');
    expect(osd476.url).toBe('https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-476/');
    expect(Date.parse(osd476.retrievedAt)).toBeGreaterThan(Date.parse('2026-11-14T18:41:32Z'));
    expect(osd476.observed.projectType).toBe('Ground Study');
    expect(osd476.observed.organism).toBe('Arabidopsis thaliana');
    expect(existsSync('src/data/osd476-raw.json')).toBe(false);
  });
});

describe.skipIf(!haveRaw)('later DONKI files, when a machine has fetched them', () => {
  it('hashes each body and refuses to call it the original acquisition', () => {
    for (const query of snapshot.queries) {
      const body = readFileSync(`${dir}/${query.id}.raw.json`);
      const meta = JSON.parse(readFileSync(`${dir}/${query.id}.meta.json`, 'utf8'));
      const checked = verifyLaterReceipt(body, meta, query);
      expect(checked.ok, JSON.stringify(checked)).toBe(true);
      expect(createHash('sha256').update(body).digest('hex')).toBe(meta.sha256);
    }
  });
});
