import { createInitialState, resolve } from './reducer';
import { saveSchema } from './persistence-schema';
import type { Decision, GameState, MissionDef } from './types';

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: 'malformed' | 'stale' | 'inconsistent' };

function sameDecision(left: Decision, right: Decision): boolean {
  return (
    left.turnIndex === right.turnIndex &&
    left.actionId === right.actionId &&
    left.rushed === right.rushed &&
    left.applied.power === right.applied.power &&
    left.applied.oxygen === right.applied.oxygen &&
    left.applied.samples === right.applied.samples &&
    left.after.power === right.after.power &&
    left.after.oxygen === right.after.oxygen &&
    left.after.samples === right.after.samples
  );
}

function sameState(left: GameState, right: GameState): boolean {
  return (
    left.schemaVersion === right.schemaVersion &&
    left.missionId === right.missionId &&
    left.snapshotVersion === right.snapshotVersion &&
    left.turnIndex === right.turnIndex &&
    left.phase === right.phase &&
    left.inspecting === right.inspecting &&
    left.resources.power === right.resources.power &&
    left.resources.oxygen === right.resources.oxygen &&
    left.samples === right.samples &&
    left.shelterStocked === right.shelterStocked &&
    left.crew === right.crew &&
    left.spaceWeather === right.spaceWeather &&
    left.outcome === right.outcome &&
    left.pauseReason === right.pauseReason &&
    left.decisionLog.length === right.decisionLog.length &&
    left.decisionLog.every((decision, index) => sameDecision(decision, right.decisionLog[index]!))
  );
}

/**
 * A save is reachable only when replaying its decision log through the reducer
 * reproduces the stored resources, crew, outcome and phase. Schema-valid but
 * impossible states, such as an explanation with no decision, are rejected.
 */
function isReachable(saved: GameState, mission: MissionDef): boolean {
  const open = saved.phase === 'situation' || saved.phase === 'inspecting';
  if (open && saved.decisionLog.length !== saved.turnIndex) return false;
  if (!open && saved.decisionLog.length !== saved.turnIndex + 1) return false;
  if (saved.phase === 'inspecting' ? saved.inspecting === null : saved.inspecting !== null) return false;
  if (open && saved.outcome !== 'in-progress') return false;
  if (saved.phase === 'ended' && saved.outcome === 'in-progress') return false;
  if ((saved.outcome === 'paused') !== (saved.pauseReason !== null)) return false;

  let cursor = createInitialState(mission, saved.snapshotVersion);
  for (let index = 0; index < saved.decisionLog.length; index += 1) {
    const decision = saved.decisionLog[index]!;
    if (cursor.phase !== 'situation' || cursor.turnIndex !== decision.turnIndex) return false;
    const committed = resolve(cursor, { type: 'COMMIT', actionId: decision.actionId }, mission);
    if (committed.rejected) return false;
    const shown = resolve(committed.state, { type: 'RESOLUTION_SHOWN' }, mission);
    if (shown.rejected) return false;
    const logged = shown.state.decisionLog[shown.state.decisionLog.length - 1];
    if (!logged || !sameDecision(logged, decision)) return false;
    const stayOnDecision = index === saved.decisionLog.length - 1 && !open;
    if (!stayOnDecision) {
      if (shown.state.outcome !== 'in-progress') return false;
      const next = resolve(shown.state, { type: 'NEXT' }, mission);
      if (next.rejected || next.state.phase !== 'situation') return false;
      cursor = next.state;
    } else {
      cursor = shown.state;
    }
  }

  if (saved.phase === 'ended') {
    if (cursor.phase !== 'explained' || cursor.outcome === 'in-progress') return false;
    const ended = resolve(cursor, { type: 'NEXT' }, mission);
    if (ended.rejected) return false;
    cursor = ended.state;
  } else if (saved.phase === 'inspecting') {
    if (cursor.phase !== 'situation' || saved.inspecting === null) return false;
    const inspected = resolve(cursor, { type: 'INSPECT', actionId: saved.inspecting }, mission);
    if (inspected.rejected) return false;
    cursor = inspected.state;
  }

  return sameState(cursor, saved);
}

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
  const normalized = state.phase === 'resolving' ? { ...state, phase: 'explained' as const } : state;
  try {
    if (!isReachable(normalized, mission)) return { ok: false, reason: 'inconsistent' };
  } catch {
    return { ok: false, reason: 'inconsistent' };
  }
  return { ok: true, state: normalized };
}

export function toSave(state: GameState): { schemaVersion: 1; snapshotVersion: string; state: GameState } {
  return { schemaVersion: 1, snapshotVersion: state.snapshotVersion, state: state.phase === 'resolving' ? { ...state, phase: 'explained' } : state };
}
