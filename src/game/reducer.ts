import { clamp, currentTurn, effectiveDelta, findAction, isRushed, unmetRequirement } from './rules';
import type { ConsequenceEvent, GameEvent, GameState, MissionDef, Outcome, PauseReason, Resolution } from './types';

export function createInitialState(mission: MissionDef, snapshotVersion: string): GameState {
  const first = mission.turns[0];
  if (!first) throw new Error('Mission has no turns');
  return {
    schemaVersion: 1,
    missionId: mission.id,
    snapshotVersion,
    turnIndex: 0,
    phase: 'situation',
    inspecting: null,
    resources: { power: clamp(mission.start.power), oxygen: clamp(mission.start.oxygen) },
    samples: 0,
    shelterStocked: false,
    crew: 'working',
    spaceWeather: first.weather,
    decisionLog: [],
    outcome: 'in-progress',
    pauseReason: null,
  };
}

const reject = (state: GameState, rejected: Resolution['rejected']): Resolution => ({ state, events: [], rejected });

function commit(state: GameState, mission: MissionDef, actionId: string): Resolution {
  // The reducer itself is the double-spend lock: a second COMMIT arrives in phase 'resolving' and changes nothing.
  if (state.phase !== 'situation' && state.phase !== 'inspecting') return reject(state, { code: 'wrong-phase' });
  const action = findAction(state, mission, actionId);
  if (!action) return reject(state, { code: 'unknown-action' });
  const unmet = unmetRequirement(state, action);
  if (unmet) return reject(state, { code: 'requirement', requirement: unmet });

  const turn = currentTurn(state, mission);
  const applied = effectiveDelta(state, action);
  const rushed = isRushed(state, action);
  const events: ConsequenceEvent[] = [];

  const power = clamp(state.resources.power + applied.power - mission.upkeep.power);
  const oxygen = clamp(state.resources.oxygen + applied.oxygen - mission.upkeep.oxygen);
  const samples = state.samples + applied.samples;
  events.push({ kind: 'resource', resource: 'power', from: state.resources.power, to: power, actionPart: applied.power, upkeepPart: -mission.upkeep.power });
  events.push({ kind: 'resource', resource: 'oxygen', from: state.resources.oxygen, to: oxygen, actionPart: applied.oxygen, upkeepPart: -mission.upkeep.oxygen });
  if (samples !== state.samples) events.push({ kind: 'samples', from: state.samples, to: samples });

  const shelterStocked = state.shelterStocked || action.sets?.shelterStocked === true;
  if (shelterStocked && !state.shelterStocked) events.push({ kind: 'shelter-stocked' });
  const crew = action.sets?.crew ?? state.crew;
  if (crew !== state.crew) events.push({ kind: 'crew', to: crew });

  let outcome: Outcome = 'in-progress';
  let pauseReason: PauseReason | null = null;
  const outsideInStorm = turn.weather === 'storm' && crew === 'working';
  if (action.breaksSafetyRule || outsideInStorm) {
    outcome = 'paused';
    pauseReason = 'safety-rule';
  } else if (power <= 0) {
    outcome = 'paused';
    pauseReason = 'power';
  } else if (oxygen <= 0) {
    outcome = 'paused';
    pauseReason = 'oxygen';
  } else if (state.turnIndex === mission.turns.length - 1) {
    const full = samples >= mission.goalSamples && power >= mission.reserve.power && oxygen >= mission.reserve.oxygen;
    outcome = full ? 'success' : 'partial';
  }
  if (outcome !== 'in-progress') events.push({ kind: 'ended', outcome, pauseReason });

  return {
    state: {
      ...state,
      phase: 'resolving',
      inspecting: null,
      resources: { power, oxygen },
      samples,
      shelterStocked,
      crew,
      outcome,
      pauseReason,
      decisionLog: [...state.decisionLog, { turnIndex: state.turnIndex, actionId: action.id, applied, rushed, after: { power, oxygen, samples } }],
    },
    events,
  };
}

/**
 * Deterministic transition function. No clock, randomness, DOM, storage or network.
 * A rejected event returns the SAME state reference so callers can detect a no-op.
 */
export function resolve(state: GameState, event: GameEvent, mission: MissionDef): Resolution {
  switch (event.type) {
    case 'INSPECT': {
      if (state.phase !== 'situation' && state.phase !== 'inspecting') return reject(state, { code: 'wrong-phase' });
      if (!findAction(state, mission, event.actionId)) return reject(state, { code: 'unknown-action' });
      if (state.inspecting === event.actionId) return { state, events: [] };
      return { state: { ...state, phase: 'inspecting', inspecting: event.actionId }, events: [] };
    }
    case 'COMMIT':
      return commit(state, mission, event.actionId);
    case 'RESOLUTION_SHOWN': {
      if (state.phase !== 'resolving') return reject(state, { code: 'wrong-phase' });
      return { state: { ...state, phase: 'explained' }, events: [] };
    }
    case 'NEXT': {
      if (state.phase !== 'explained') return reject(state, { code: 'wrong-phase' });
      if (state.outcome !== 'in-progress') return { state: { ...state, phase: 'ended' }, events: [] };
      const turnIndex = state.turnIndex + 1;
      const next = mission.turns[turnIndex];
      if (!next) return reject(state, { code: 'wrong-phase' });
      const events: ConsequenceEvent[] = next.weather !== state.spaceWeather ? [{ kind: 'weather', to: next.weather }] : [];
      return { state: { ...state, turnIndex, phase: 'situation', spaceWeather: next.weather }, events };
    }
  }
}
