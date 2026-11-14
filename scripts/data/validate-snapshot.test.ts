import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeCmes, normalizeEnlil, normalizeFlares, normalizeSeps, parseDonkiBody } from '../../src/adapters/donki';
import { snapshot } from '../../src/data';

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

describe.skipIf(haveRaw)('raw DONKI files', () => {
  it('are missing: run `npm run data:fetch` first', () => {
    expect.fail('No raw files in .agent-bus/evidence/data. This check cannot pass without fetching from NASA.');
  });
});
