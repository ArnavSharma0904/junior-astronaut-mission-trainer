import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeCmes, normalizeEnlil, normalizeFlares, normalizeSeps, parseDonkiBody } from '../../src/adapters/donki';
import { snapshot } from '../../src/data';
import osd476 from '../../src/data/osd476-verification.json' with { type: 'json' };
import { verifyLaterReceipt } from './fetch-donki.mjs';

// Later verification bodies live in the package. They are not the original 14 November acquisition,
// which was never written to disk. A matching hash is still a later file.
const laterDir = 'src/data/verification/donki';
const laterBody = (id: string) => readFileSync(`${laterDir}/${id}.raw.json`);
const committed = (type: string) => snapshot.events.filter((event) => event.type === type);

describe('later DONKI fixtures are real bodies and are not renamed into the original acquisition', () => {
  it('keeps the 19 curated records and the historical statement that the original raw was not stored', () => {
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

  it('hashes each later body, binds the query, and allows an unchanged upstream response', () => {
    for (const query of snapshot.queries) {
      const body = laterBody(query.id);
      const meta = JSON.parse(readFileSync(`${laterDir}/${query.id}.meta.json`, 'utf8'));
      const checked = verifyLaterReceipt(body, meta, query);
      expect(checked.ok, JSON.stringify(checked)).toBe(true);
      expect(meta.verification).toBe('later-verification');
      expect(meta.notOriginalAcquisition).toBe(true);
      expect(meta.httpStatus).toBe(200);
      expect(createHash('sha256').update(body).digest('hex')).toBe(meta.sha256);
      expect(JSON.parse(body.toString('utf8'))).toHaveLength(meta.recordCount);
      const tampered = Buffer.from(body);
      const last = tampered.length - 1;
      tampered[last] = (tampered[last] ?? 0) ^ 1;
      expect(verifyLaterReceipt(tampered, meta, query).ok).toBe(false);
    }
  });

  it('rebuilds the curated events from the later bodies without treating them as the original files', () => {
    expect(normalizeFlares(parseDonkiBody(laterBody('flr').toString('utf8')), 'flr')).toEqual(committed('FLR'));
    expect(normalizeSeps(parseDonkiBody(laterBody('sep').toString('utf8')), 'sep', ['2024-05-11T01:10:00-FLR-001'])).toEqual(committed('SEP'));
    expect(normalizeCmes(parseDonkiBody(laterBody('cme').toString('utf8')), 'cme', ['2024-05-09T09:24:00-CME-001', '2024-05-11T01:36:00-CME-001'])).toEqual(committed('CME'));
    expect(normalizeEnlil(parseDonkiBody(laterBody('enlil').toString('utf8')), 'enlil', '2024-05-09T09:24')).toEqual(committed('ENLIL'));
  });
});

describe('OSD-476 later body', () => {
  it('hashes the stored response and reads the ground-study fields from that body', () => {
    const body = readFileSync('src/data/verification/osd476-raw.json');
    const study = JSON.parse(body.toString('utf8'))['OSD-476'].metadata;
    expect(createHash('sha256').update(body).digest('hex')).toBe(osd476.sha256);
    expect(body.length).toBe(osd476.bytes);
    expect(osd476.verification).toBe('later-verification');
    expect(osd476.notOriginalAcquisition).toBe(true);
    expect(osd476.httpStatus).toBe(200);
    expect(osd476.contentType).toBe('application/json');
    expect(osd476.url).toBe('https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-476/');
    expect(Date.parse(osd476.retrievedAt)).toBeGreaterThan(Date.parse('2026-11-14T18:41:32Z'));
    expect(study.organism).toBe('Arabidopsis thaliana');
    expect(study['project type']).toBe('Ground Study');
    expect(study['study identifier']).toBe('OSD-476');
    expect(study['study title']).toMatch(/Apollo lunar regolith/);
    expect(JSON.stringify(study)).toMatch(/Apollo/);
    expect(JSON.stringify(study).toLowerCase()).not.toMatch(/oxygen yield/);
  });
});
