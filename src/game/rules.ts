import type { ActionDef, Delta, GameState, MissionDef, Requirement, TurnDef } from './types';

export const RESOURCE_MIN = 0;
export const RESOURCE_MAX = 100;

export function clamp(value: number): number {
  return Math.min(RESOURCE_MAX, Math.max(RESOURCE_MIN, Math.trunc(value)));
}

export function currentTurn(state: GameState, mission: MissionDef): TurnDef {
  const turn = mission.turns[state.turnIndex];
  if (!turn) throw new Error(`No turn ${state.turnIndex} in mission ${mission.id}`);
  return turn;
}

export function findAction(state: GameState, mission: MissionDef, actionId: string): ActionDef | undefined {
  return currentTurn(state, mission).actions.find((action) => action.id === actionId);
}

/** First unmet requirement, or null when the action is legal in this state. */
export function unmetRequirement(state: GameState, action: ActionDef): Requirement | null {
  for (const requirement of action.requires ?? []) {
    if (requirement.kind === 'minPower' && state.resources.power < requirement.value) return requirement;
    if (requirement.kind === 'shelterStocked' && !state.shelterStocked) return requirement;
    if (requirement.kind === 'shelterNotStocked' && state.shelterStocked) return requirement;
  }
  return null;
}

export function isRushed(state: GameState, action: ActionDef): boolean {
  return action.deltaIfUnstocked !== undefined && !state.shelterStocked;
}

/** The delta this action would apply right now, before upkeep. Used by both the reducer and the preview. */
export function effectiveDelta(state: GameState, action: ActionDef): Required<Delta> {
  const chosen = isRushed(state, action) ? action.deltaIfUnstocked! : action.delta;
  return { power: chosen.power ?? 0, oxygen: chosen.oxygen ?? 0, samples: chosen.samples ?? 0 };
}
