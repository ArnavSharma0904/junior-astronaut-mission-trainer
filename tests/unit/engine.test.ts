import { describe, expect, it } from 'vitest';
import { mission } from '../../src/content/mission';
import { resolve } from '../../src/game/reducer';
import { actionPreviews, debrief } from '../../src/game/selectors';
import { play, playAll, start } from './helpers';

describe('mission engine', () => {
  it('starts in the first situation with full reserves and no samples', () => {
    const state = start();
    expect(state).toMatchObject({ turnIndex: 0, phase: 'situation', samples: 0, crew: 'working', shelterStocked: false, outcome: 'in-progress' });
    expect(state.resources).toEqual(mission.start);
  });

  it('applies the action and upkeep exactly once and logs the decision', () => {
    const before = start();
    const { state, events } = resolve(before, { type: 'COMMIT', actionId: 'drill-1' }, mission);
    expect(state.resources.power).toBe(before.resources.power - 16 - mission.upkeep.power);
    expect(state.resources.oxygen).toBe(before.resources.oxygen - mission.upkeep.oxygen);
    expect(state.samples).toBe(1);
    expect(state.phase).toBe('resolving');
    expect(state.decisionLog).toHaveLength(1);
    expect(events.find((event) => event.kind === 'samples')).toEqual({ kind: 'samples', from: 0, to: 1 });
  });

  it('ignores a second commit while the first is resolving (no double spend)', () => {
    const first = resolve(start(), { type: 'COMMIT', actionId: 'drill-1' }, mission).state;
    const second = resolve(first, { type: 'COMMIT', actionId: 'drill-1' }, mission);
    expect(second.state).toBe(first);
    expect(second.rejected).toEqual({ code: 'wrong-phase' });
    expect(second.events).toEqual([]);
  });

  it('rejects unknown actions and out-of-order events without changing state', () => {
    const state = start();
    expect(resolve(state, { type: 'COMMIT', actionId: 'nope' }, mission)).toMatchObject({ state, rejected: { code: 'unknown-action' } });
    expect(resolve(state, { type: 'NEXT' }, mission).state).toBe(state);
    expect(resolve(state, { type: 'RESOLUTION_SHOWN' }, mission).state).toBe(state);
    expect(resolve(state, { type: 'COMMIT', actionId: 'drill-2' }, mission).rejected).toEqual({ code: 'unknown-action' });
  });

  it('explains why an unavailable action cannot be taken', () => {
    const stocked = play(play(start(), 'charge-1'), 'stock-2');
    const preview = actionPreviews(stocked, mission).find((item) => item.action.id === 'stock-3');
    expect(preview).toMatchObject({ available: false, blockedBy: { kind: 'shelterNotStocked' } });
    const attempt = resolve(stocked, { type: 'COMMIT', actionId: 'stock-3' }, mission);
    expect(attempt.state).toBe(stocked);
    expect(attempt.rejected).toEqual({ code: 'requirement', requirement: { kind: 'shelterNotStocked' } });
  });

  it('charges more for a rushed shelter move than a prepared one', () => {
    const prepared = play(play(play(start(), 'charge-1'), 'stock-2'), 'drill-3');
    const unprepared = play(play(play(start(), 'charge-1'), 'charge-2'), 'drill-3');
    const cost = (state: ReturnType<typeof start>) => actionPreviews(state, mission).find((item) => item.action.id === 'shelter-4')!;
    expect(cost(prepared)).toMatchObject({ rushed: false, delta: { power: -4, oxygen: 0 } });
    expect(cost(unprepared)).toMatchObject({ rushed: true, delta: { power: -12, oxygen: -12 } });
  });

  it('pauses the mission when the crew works outside during the storm, with a named reason', () => {
    const final = playAll(['charge-1', 'drill-2', 'drill-3', 'outside-4']);
    expect(final).toMatchObject({ phase: 'ended', outcome: 'paused', pauseReason: 'safety-rule' });
  });

  it('moves the crew into shelter for the storm and back out after it', () => {
    const inStorm = playAll(['charge-1', 'stock-2', 'drill-3', 'shelter-4']);
    expect(inStorm.crew).toBe('sheltered');
    expect(inStorm.spaceWeather).toBe('storm');
    const after = play(play(inStorm, 'rest-5'), 'repair-6');
    expect(after.crew).toBe('working');
  });

  it('reaches a full success and reports it in the debrief', () => {
    const final = playAll(['charge-1', 'drill-2', 'stock-3', 'remote-4', 'scrub-5', 'drill-6']);
    expect(final).toMatchObject({ phase: 'ended', outcome: 'success', samples: 3 });
    expect(debrief(final, mission).missing).toEqual({ samples: false, power: false, oxygen: false });
  });

  it('reports exactly what was short in a partial result', () => {
    const final = playAll(['charge-1', 'charge-2', 'grow-3', 'shelter-4', 'rest-5', 'repair-6']);
    expect(final.outcome).toBe('partial');
    expect(debrief(final, mission).missing.samples).toBe(true);
  });

  it('is deterministic: the same choices always give a deeply equal result', () => {
    const ids = ['drill-1', 'stock-2', 'grow-3', 'remote-4', 'scrub-5', 'drill-6'];
    expect(playAll(ids)).toEqual(playAll(ids));
  });

  it('tracks which action is being inspected without spending anything', () => {
    const state = start();
    const inspected = resolve(state, { type: 'INSPECT', actionId: 'grow-1' }, mission).state;
    expect(inspected).toMatchObject({ phase: 'inspecting', inspecting: 'grow-1', resources: state.resources, decisionLog: [] });
    expect(resolve(inspected, { type: 'INSPECT', actionId: 'grow-1' }, mission).state).toBe(inspected);
  });
});
