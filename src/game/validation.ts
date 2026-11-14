import { saveSchema } from './persistence-schema';
import { currentTurn } from './rules';
import type { GameState, MissionDef } from './types';

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: 'malformed' | 'stale' | 'inconsistent' };

/**
 * Validates an untrusted saved value (already JSON-parsed) against the schema AND the current mission.
 * A save from another mission or data snapshot is stale and is never silently migrated.
 */
export function loadSavedState(raw: unknown, mission: MissionDef, snapshotVersion: string): LoadResult {
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'malformed' };
  const state = parsed.data.state as GameState;
  if (parsed.data.snapshotVersion !== snapshotVersion || state.snapshotVersion !== snapshotVersion || state.missionId !== mission.id) {
    return { ok: false, reason: 'stale' };
  }
  if (state.turnIndex >= mission.turns.length) return { ok: false, reason: 'inconsistent' };
  if (state.decisionLog.length < state.turnIndex || state.decisionLog.length > state.turnIndex + 1) return { ok: false, reason: 'inconsistent' };
  const turn = currentTurn(state, mission);
  if (state.inspecting !== null && !turn.actions.some((action) => action.id === state.inspecting)) return { ok: false, reason: 'inconsistent' };
  if (state.phase === 'ended' && state.outcome === 'in-progress') return { ok: false, reason: 'inconsistent' };
  // A save taken mid-animation resumes after the animation: the decision was already applied.
  return { ok: true, state: state.phase === 'resolving' ? { ...state, phase: 'explained' } : state };
}

export function toSave(state: GameState): { schemaVersion: 1; snapshotVersion: string; state: GameState } {
  return { schemaVersion: 1, snapshotVersion: state.snapshotVersion, state: state.phase === 'resolving' ? { ...state, phase: 'explained' } : state };
}
