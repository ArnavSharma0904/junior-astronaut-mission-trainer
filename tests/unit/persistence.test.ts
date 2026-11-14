import { describe, expect, it } from 'vitest';
import { mission } from '../../src/content/mission';
import { resolve } from '../../src/game/reducer';
import { loadSavedState, toSave } from '../../src/game/validation';
import { play, playAll, SNAPSHOT, start } from './helpers';

const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('saved missions', () => {
  it('round-trips a mid-mission state', () => {
    const state = play(play(start(), 'charge-1'), 'stock-2');
    expect(loadSavedState(roundTrip(toSave(state)), mission, SNAPSHOT)).toEqual({ ok: true, state });
  });

  it('resumes a save taken mid-resolution after the decision, never before it', () => {
    const resolving = resolve(start(), { type: 'COMMIT', actionId: 'drill-1' }, mission).state;
    const loaded = loadSavedState(roundTrip(toSave(resolving)), mission, SNAPSHOT);
    expect(loaded).toMatchObject({ ok: true, state: { phase: 'explained', samples: 1 } });
  });

  it.each([
    ['null', null],
    ['a string', 'hello'],
    ['an HTML error page', '<html><body>502 Bad Gateway</body></html>'],
    ['an empty object', {}],
    ['a wrong version', { ...toSave(start()), schemaVersion: 2 }],
    ['a NaN resource', { ...toSave(start()), state: { ...start(), resources: { power: Number.NaN, oxygen: 50 } } }],
    ['an out-of-range resource', { ...toSave(start()), state: { ...start(), resources: { power: 500, oxygen: 50 } } }],
    ['an unknown field', { ...toSave(start()), state: { ...start(), cheat: true } }],
  ])('rejects %s as malformed', (_label, raw) => {
    expect(loadSavedState(raw, mission, SNAPSHOT)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('treats a save from another data snapshot or mission as stale', () => {
    expect(loadSavedState(roundTrip(toSave(start())), mission, 'other-snapshot')).toEqual({ ok: false, reason: 'stale' });
    const otherMission = { ...toSave(start()), state: { ...start(), missionId: 'other' } };
    expect(loadSavedState(roundTrip(otherMission), mission, SNAPSHOT)).toEqual({ ok: false, reason: 'stale' });
  });

  it('rejects a well-formed save that does not fit the mission', () => {
    const beyond = { ...toSave(start()), state: { ...start(), turnIndex: 40 } };
    expect(loadSavedState(roundTrip(beyond), mission, SNAPSHOT)).toEqual({ ok: false, reason: 'inconsistent' });
    const skipped = { ...toSave(start()), state: { ...start(), turnIndex: 3 } };
    expect(loadSavedState(roundTrip(skipped), mission, SNAPSHOT)).toEqual({ ok: false, reason: 'inconsistent' });
  });

  it('rejects a schema-valid explanation that has no decision behind it', () => {
    const explainedWithNoDecision = {
      ...toSave(start()),
      state: { ...start(), phase: 'explained', inspecting: null, decisionLog: [], turnIndex: 0 },
    };
    expect(loadSavedState(roundTrip(explainedWithNoDecision), mission, SNAPSHOT)).toEqual({ ok: false, reason: 'inconsistent' });
  });

  it('rejects a schema-valid save whose resources do not follow the logged action', () => {
    const played = play(start(), 'charge-1');
    const tampered = { ...toSave(played), state: { ...played, resources: { power: played.resources.power - 5, oxygen: played.resources.oxygen } } };
    expect(loadSavedState(roundTrip(tampered), mission, SNAPSHOT)).toEqual({ ok: false, reason: 'inconsistent' });
  });

  it('accepts an inspection and a finished mission that the engine can actually reach', () => {
    const inspected = resolve(start(), { type: 'INSPECT', actionId: 'grow-1' }, mission).state;
    expect(loadSavedState(roundTrip(toSave(inspected)), mission, SNAPSHOT)).toEqual({ ok: true, state: inspected });
    const ended = playAll(['charge-1', 'drill-2', 'drill-3', 'outside-4']);
    expect(loadSavedState(roundTrip(toSave(ended)), mission, SNAPSHOT)).toEqual({ ok: true, state: ended });
  });
});
