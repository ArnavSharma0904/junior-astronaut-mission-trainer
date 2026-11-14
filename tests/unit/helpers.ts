import { mission } from '../../src/content/mission';
import { createInitialState, resolve } from '../../src/game/reducer';
import { actionPreviews } from '../../src/game/selectors';
import type { GameState } from '../../src/game/types';

export const SNAPSHOT = 'test-snapshot';
export const start = (): GameState => createInitialState(mission, SNAPSHOT);

/** An action the rules reject. Distinct from an assertion failure so the balance search can ignore only this. */
export class RejectedAction extends Error {
  readonly actionId: string;
  constructor(actionId: string, detail: string) {
    super(`Rejected ${actionId}: ${detail}`);
    this.name = 'RejectedAction';
    this.actionId = actionId;
  }
}

export function ignoreIllegalAction(error: unknown): void {
  if (!(error instanceof RejectedAction)) throw error;
}

/** Commits one action and advances to the next situation (or the end). Throws if the engine rejects it. */
export function play(state: GameState, actionId: string): GameState {
  const committed = resolve(state, { type: 'COMMIT', actionId }, mission);
  if (committed.rejected) throw new RejectedAction(actionId, JSON.stringify(committed.rejected));
  const shown = resolve(committed.state, { type: 'RESOLUTION_SHOWN' }, mission).state;
  return resolve(shown, { type: 'NEXT' }, mission).state;
}

export const playAll = (ids: string[]): GameState => ids.reduce(play, start());

export interface Path {
  ids: string[];
  final: GameState;
}

/** Every legal sequence of actions from the start to an ended state. */
export function enumerate(): Path[] {
  const paths: Path[] = [];
  const walk = (state: GameState, ids: string[]) => {
    if (state.phase === 'ended') {
      paths.push({ ids, final: state });
      return;
    }
    for (const preview of actionPreviews(state, mission)) {
      if (preview.available) walk(play(state, preview.action.id), [...ids, preview.action.id]);
    }
  };
  walk(start(), []);
  return paths;
}
