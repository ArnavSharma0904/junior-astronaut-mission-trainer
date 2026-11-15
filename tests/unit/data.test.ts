import { describe, expect, it } from 'vitest';
import { DonkiFormatError, minutesBetween, normalizeCmes, normalizeEnlil, normalizeFlares, normalizeSeps, parseDonkiBody } from '../../src/adapters/donki';
import { mission } from '../../src/content/mission';
import { eventsForSource, getEvent, getSource, snapshot, sources } from '../../src/data';
import { isUtcTimestamp, snapshotSchema, sourceManifestSchema } from '../../src/data/schema';
import fixtures from './fixtures/donki-raw.json' with { type: 'json' };

const committed = (type: string) => snapshot.events.filter((event) => event.type === type);

describe('committed NASA snapshot and source manifest', () => {
  it('parse strictly and share one snapshot version', () => {
    expect(sources.snapshotVersion).toBe(snapshot.snapshotVersion);
    expect(snapshot.events.length).toBeGreaterThan(10);
  });

  it('resolve every evidence and source id used by the mission', () => {
    const ids = new Set(mission.turns.flatMap((turn) => [...turn.evidenceIds, ...turn.actions.flatMap((action) => action.sourceIds)]));
    for (const id of ids) expect(() => getSource(id)).not.toThrow();
  });

  it('back every snapshot source with archived records that exist', () => {
    for (const record of sources.records.filter((item) => item.status === 'snapshot')) {
      expect(record.rawIds.length).toBeGreaterThan(0);
      expect(record.contentSha256).toMatch(/^[a-f0-9]{64}$/);
      for (const rawId of record.rawIds) expect(() => getEvent(rawId)).not.toThrow();
    }
  });

  it('never presents anything as live and always says what a record does not support', () => {
    for (const record of sources.records) {
      expect(['snapshot', 'reference']).toContain(record.status);
      expect(record.notSupported.length).toBeGreaterThan(0);
    }
  });

  it('keeps forecast-model records separate from observations', () => {
    expect(getSource('donki-enlil-run-a').kind).toBe('model-output');
    expect(getSource('donki-enlil-run-b').kind).toBe('model-output');
    for (const event of eventsForSource('donki-enlil-run-a')) expect(event.isModelDerived).toBe(true);
    for (const id of ['donki-flr-2024-05-11', 'donki-sep-2024-05-11']) {
      for (const event of eventsForSource(id)) expect(event.isModelDerived).toBe(false);
    }
    expect(snapshot.events.filter((event) => event.type === 'SEP' && event.isModelDerived).length).toBe(2);
  });

  it('derives the 47-minute warning gap from the two archived times', () => {
    const flare = getEvent('2024-05-11T01:10:00-FLR-001');
    const particles = getEvent('2024-05-11T02:10:00-SEP-001');
    if (flare.type !== 'FLR') throw new Error('expected a flare');
    expect(minutesBetween(flare.peakTimeUtc, particles.timeUtc)).toBe(47);
  });

  it('shows that the forecast changed between two model runs', () => {
    const [a] = eventsForSource('donki-enlil-run-a');
    const [b] = eventsForSource('donki-enlil-run-b');
    if (a?.type !== 'ENLIL' || b?.type !== 'ENLIL') throw new Error('expected model runs');
    expect(minutesBetween(b.enlil.estimatedShockArrivalTime!, a.enlil.estimatedShockArrivalTime!)).toBe(16 * 60 + 12);
    expect(minutesBetween(a.timeUtc, b.timeUtc)).toBeGreaterThan(0);
  });

  it('rejects a snapshot with no events, a wrong model flag, or a live label', () => {
    expect(snapshotSchema.safeParse({ ...snapshot, events: [] }).success).toBe(false);
    const first = snapshot.events.find((event) => event.type === 'ENLIL')!;
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...first, isModelDerived: false }] }).success).toBe(false);
    const record = { ...sources.records[0]!, status: 'live' };
    expect(sourceManifestSchema.safeParse({ ...sources, records: [record] }).success).toBe(false);
  });

  it('rejects records with missing dates, bad units of time, or unknown fields', () => {
    const flare = snapshot.events[0]!;
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...flare, peakTimeUtc: undefined }] }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...flare, timeUtc: '09/05/2024 08:45' }] }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...flare, doseSv: 1 }] }).success).toBe(false);
  });

  it('checks the calendar, including a leap day, and does not require one global clock order', () => {
    expect(isUtcTimestamp('2024-02-29T00:00Z')).toBe(true);
    expect(isUtcTimestamp('2023-02-29T00:00Z')).toBe(false);
    expect(isUtcTimestamp('2024-02-30T12:00Z')).toBe(false);
    expect(isUtcTimestamp('2024-05-11T24:00Z')).toBe(false);
    const flare = snapshot.events.find((event) => event.type === 'FLR')!;
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...flare, timeUtc: '2024-02-30T00:00Z' }] }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...snapshot, events: [...snapshot.events].reverse() }).success).toBe(true);
  });

  it('rejects a duplicate query, a mixed instrument, a flare out of order, and a duplicate source id', () => {
    expect(snapshotSchema.safeParse({ ...snapshot, queries: [snapshot.queries[0], snapshot.queries[0]] }).success).toBe(false);
    const sep = snapshot.events.find((event) => event.type === 'SEP' && !event.isModelDerived)!;
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...sep, instrument: 'GOES-16 + MODEL:forecast' }] }).success).toBe(false);
    const flare = snapshot.events.find((event) => event.type === 'FLR')!;
    expect(snapshotSchema.safeParse({ ...snapshot, events: [{ ...flare, peakTimeUtc: '2024-05-01T00:00Z' }] }).success).toBe(false);
    expect(sourceManifestSchema.safeParse({ ...sources, records: [sources.records[0], sources.records[0]] }).success).toBe(false);
  });
});

describe('DONKI normalizer', () => {
  it('rebuilds the committed events from raw-shaped records', () => {
    expect(normalizeFlares(fixtures.flr, 'flr')).toEqual(committed('FLR'));
    expect(normalizeSeps(fixtures.sep, 'sep', ['2024-05-11T01:10:00-FLR-001'])).toEqual(committed('SEP'));
    expect(normalizeCmes(fixtures.cme, 'cme', ['2024-05-09T09:24:00-CME-001', '2024-05-11T01:36:00-CME-001'])).toEqual(committed('CME'));
    expect(normalizeEnlil(fixtures.enlil, 'enlil', '2024-05-09T09:24')).toEqual(committed('ENLIL'));
  });

  it('drops notifications and links and tolerates null linked events', () => {
    const [flare] = normalizeFlares(fixtures.flr.slice(1, 2), 'flr');
    expect(JSON.stringify(flare)).not.toMatch(/sentNotifications|example\.invalid|messageURL/);
  });

  it('treats an empty array as a valid, empty answer and invents nothing', () => {
    expect(parseDonkiBody('[]')).toEqual([]);
    expect(normalizeFlares([], 'flr')).toEqual([]);
  });

  it.each([
    ['an HTML error page', '<!doctype html><html><body>503 Service Unavailable</body></html>'],
    ['malformed JSON', '[{"flrID": '],
    ['a JSON object instead of an array', '{"error":"OVER_RATE_LIMIT"}'],
  ])('rejects %s', (_label, body) => {
    expect(() => parseDonkiBody(body)).toThrow(DonkiFormatError);
  });

  it('rejects a particle record that mixes an observation with a model', () => {
    expect(() =>
      normalizeSeps(
        [{ sepID: '2024-05-11T02:10:00-SEP-001', eventTime: '2024-05-11T02:10Z', instruments: [{ displayName: 'GOES-16 SEISS' }, { displayName: 'MODEL:forecast' }], versionId: 1 }],
        'sep',
      ),
    ).toThrow(/mixes/);
  });

  it('rejects a record that is missing a required time or id', () => {
    const withoutPeak: Record<string, unknown> = { ...fixtures.flr[0]! };
    delete withoutPeak.peakTime;
    expect(() => normalizeFlares([withoutPeak], 'flr')).toThrow(/peakTime/);
    expect(() => normalizeSeps([{ eventTime: '2024-05-11T02:10Z' }], 'sep')).toThrow(DonkiFormatError);
  });
});

describe('words and numbers stay in step', () => {
  it('states the derived warning gap exactly as the data gives it', async () => {
    const { warningGapMinutes } = await import('../../src/content/evidence');
    const claim = getSource('donki-sep-2024-05-11').supportedClaim;
    expect(claim).toContain(`${warningGapMinutes()} minutes`);
    expect(claim).toContain('not a measured arrival at the Moon');
    expect(snapshot.events).toHaveLength(19);
  });

  it('keeps game numbers out of the copy so they can only come from mission data', async () => {
    const { actionCopy, turnCopy, principleCopy } = await import('../../src/content/copy');
    const strings = [...Object.values(actionCopy).flatMap((item) => [item.label, item.effect, item.happened]), ...Object.values(turnCopy).flatMap((item) => [item.title, item.situation, item.lesson]), ...Object.values(principleCopy)];
    expect(strings.filter((text) => /\d/.test(text))).toEqual([]);
  });

  it('has words for every turn, action and principle in the mission', async () => {
    const { actionCopy, turnCopy, principleCopy } = await import('../../src/content/copy');
    for (const turn of mission.turns) {
      expect(turnCopy[turn.id]).toBeDefined();
      for (const action of turn.actions) {
        expect(actionCopy[action.id]).toBeDefined();
        expect(principleCopy[action.principleId]).toBeDefined();
      }
    }
  });
});
