import { band, type Band } from '../game/selectors';
import type { GameState, MissionDef } from '../game/types';

export type SceneModule = 'drill' | 'array' | 'dome' | 'shelter' | 'hab';

/** Everything the scene needs, derived from game state. The scene never reads or changes game state itself. */
export interface SceneModel {
  power: Band;
  oxygen: Band;
  crew: GameState['crew'];
  shelterStocked: boolean;
  weather: GameState['spaceWeather'];
  samples: number;
  goalSamples: number;
  outcome: GameState['outcome'];
  /** Module touched by the most recent decision, highlighted while it resolves. */
  pulse: SceneModule | null;
  resolving: boolean;
  description: string;
}

function moduleFor(actionId: string): SceneModule {
  if (actionId.startsWith('drill') || actionId.startsWith('remote') || actionId.startsWith('outside')) return 'drill';
  if (actionId.startsWith('charge') || actionId.startsWith('repair')) return 'array';
  if (actionId.startsWith('grow')) return 'dome';
  if (actionId.startsWith('stock') || actionId.startsWith('shelter')) return 'shelter';
  return 'hab';
}

const bandWord: Record<Band, string> = { strong: 'strong', steady: 'steady', low: 'low' };
const weatherWord: Record<GameState['spaceWeather'], string> = {
  quiet: 'The sky is quiet.',
  watch: 'Faint streaks near the Sun show it is active.',
  storm: 'Streaks cross the sky: a particle storm is under way.',
  clearing: 'The streaks are thinning as the storm clears.',
};

export function toSceneModel(state: GameState, mission: MissionDef): SceneModel {
  const last = state.decisionLog[state.decisionLog.length - 1];
  const showPulse = last !== undefined && (state.phase === 'resolving' || state.phase === 'explained') && last.turnIndex === state.turnIndex;
  const power = band(state.resources.power);
  const oxygen = band(state.resources.oxygen);
  const description = [
    'A small Moon base on a crater rim near the south pole, lit by a low Sun.',
    `Base lights show power is ${bandWord[power]}.`,
    `The greenhouse shows oxygen is ${bandWord[oxygen]}.`,
    state.pauseReason === 'safety-rule'
      ? 'The crew chose to stay outside, which broke the safety rule. Mission Control brought them inside the shelter. The mission is paused and everyone is safe.'
      : state.crew === 'sheltered'
        ? 'The crew is inside the soil-covered shelter.'
        : 'The crew is working at the drill.',
    state.shelterStocked ? 'Supplies are stacked at the shelter door.' : '',
    `${state.samples} of ${mission.goalSamples} ice samples are in the rack.`,
    weatherWord[state.spaceWeather],
  ]
    .filter(Boolean)
    .join(' ');
  return {
    power,
    oxygen,
    crew: state.crew,
    shelterStocked: state.shelterStocked,
    weather: state.spaceWeather,
    samples: state.samples,
    goalSamples: mission.goalSamples,
    outcome: state.outcome,
    pulse: showPulse ? moduleFor(last.actionId) : null,
    resolving: state.phase === 'resolving',
    description,
  };
}

export const BRIEFING_SCENE: SceneModel = {
  power: 'strong',
  oxygen: 'strong',
  crew: 'working',
  shelterStocked: false,
  weather: 'quiet',
  samples: 0,
  goalSamples: 3,
  outcome: 'in-progress',
  pulse: null,
  resolving: false,
  description: 'A small Moon base on a crater rim near the south pole, lit by a low Sun, with Earth in the sky.',
};
