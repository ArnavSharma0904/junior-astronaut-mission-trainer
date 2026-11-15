import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assessAcquiredBody } from './validate-acquisition';

const flare = {
  flrID: '2024-05-09T08:45:00-FLR-001',
  beginTime: '2024-05-09T08:45Z',
  peakTime: '2024-05-09T09:13Z',
  endTime: '2024-05-09T09:36Z',
  classType: 'X2.2',
  sourceLocation: 'N17W24',
  activeRegionNum: 13664,
  instruments: [{ displayName: 'GOES' }],
  versionId: 1,
};

describe('acquisition output is validated separately from the packaged fixtures', () => {
  it('accepts an empty download and a real flare, and rejects an unrelated object', () => {
    expect(assessAcquiredBody('flr', '[]')).toEqual({ ok: true, empty: true, recordCount: 0 });
    const kept = assessAcquiredBody('flr', JSON.stringify([flare]));
    expect(kept.ok).toBe(true);
    if (kept.ok) expect(kept.recordCount).toBe(1);
    expect(assessAcquiredBody('flr', '[{"unrelated":"not a flare"}]').ok).toBe(false);
  });

  it('does not treat a temp download folder as the tracked fixture check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jamt-acquisition-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'flr.raw.json'), '[{"unrelated":"not a flare"}]');
    const result = assessAcquiredBody('flr', '[{"unrelated":"not a flare"}]');
    expect(result).toMatchObject({ ok: false, reason: 'schema' });
    expect(dir.startsWith(tmpdir())).toBe(true);
  });
});
