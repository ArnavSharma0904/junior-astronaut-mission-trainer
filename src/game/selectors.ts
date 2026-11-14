import { currentTurn, effectiveDelta, isRushed, unmetRequirement } from './rules';
import type { ActionDef, Delta, GameState, MissionDef, Requirement } from './types';

export type Band = 'strong' | 'steady' | 'low';

export function band(value: number): Band {
  if (value >= 60) return 'strong';
  if (value >= 30) return 'steady';
  return 'low';
}

export interface ActionPreview {
  action: ActionDef;
  available: boolean;
  blockedBy: Requirement | null;
  rushed: boolean;
  /** Action effect only. */
  delta: Required<Delta>;
  /** Action effect plus upkeep: what the meters will actually do. */
  net: { power: number; oxygen: number };
}

export function actionPreviews(state: GameState, mission: MissionDef): ActionPreview[] {
  return currentTurn(state, mission).actions.map((action) => {
    const blockedBy = unmetRequirement(state, action);
    const delta = effectiveDelta(state, action);
    return {
      action,
      available: blockedBy === null,
      blockedBy,
      rushed: isRushed(state, action),
      delta,
      net: { power: delta.power - mission.upkeep.power, oxygen: delta.oxygen - mission.upkeep.oxygen },
    };
  });
}

export function hasLegalAction(state: GameState, mission: MissionDef): boolean {
  return actionPreviews(state, mission).some((preview) => preview.available);
}

export function isCritical(state: GameState): boolean {
  return state.outcome === 'in-progress' && (band(state.resources.power) === 'low' || band(state.resources.oxygen) === 'low');
}

export interface DebriefSummary {
  outcome: GameState['outcome'];
  pauseReason: GameState['pauseReason'];
  samples: number;
  goalSamples: number;
  missing: { samples: boolean; power: boolean; oxygen: boolean };
}

export function debrief(state: GameState, mission: MissionDef): DebriefSummary {
  return {
    outcome: state.outcome,
    pauseReason: state.pauseReason,
    samples: state.samples,
    goalSamples: mission.goalSamples,
    missing: {
      samples: state.samples < mission.goalSamples,
      power: state.resources.power < mission.reserve.power,
      oxygen: state.resources.oxygen < mission.reserve.oxygen,
    },
  };
}
