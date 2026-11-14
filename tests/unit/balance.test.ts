import { describe, expect, it } from 'vitest';
import { mission, TRAP_ACTION_IDS } from '../../src/content/mission';
import { hasLegalAction } from '../../src/game/selectors';
import type { GameState } from '../../src/game/types';
import { enumerate, play, start } from './helpers';

const paths = enumerate();
const wins = paths.filter((path) => path.final.outcome === 'success');
const allActionIds = mission.turns.flatMap((turn) => turn.actions.map((action) => action.id));

describe('mission balance (every legal path enumerated)', () => {
  it('has a manageable, fully explored decision tree', () => {
    expect(paths.length).toBeGreaterThan(50);
    expect(paths.length).toBeLessThan(729);
  });

  it('keeps every reachable value a finite integer inside its range', () => {
    for (const { final } of paths) {
      for (const entry of final.decisionLog) {
        for (const value of [entry.after.power, entry.after.oxygen, entry.after.samples]) {
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('never softlocks: every non-final situation has at least one legal action', () => {
    const visit = (state: GameState) => {
      if (state.phase === 'ended') return;
      expect(hasLegalAction(state, mission)).toBe(true);
      for (const action of mission.turns[state.turnIndex]!.actions) {
        try {
          visit(play(state, action.id));
        } catch {
          // Illegal in this state: covered by the engine tests.
        }
      }
    };
    visit(start());
  });

  it('offers several genuinely different winning strategies', () => {
    expect(wins.length).toBeGreaterThanOrEqual(8);
    const differsEnough = wins.some((a) => wins.some((b) => a.ids.filter((id, index) => id !== b.ids[index]).length >= 3));
    expect(differsEnough).toBe(true);
    expect(wins.some((path) => path.ids.some((id) => id.startsWith('stock-')))).toBe(true);
    expect(wins.some((path) => !path.ids.some((id) => id.startsWith('stock-')))).toBe(true);
  });

  it('has no universal best option: always picking the same slot never wins', () => {
    for (const slot of [0, 1, 2]) {
      let state = start();
      while (state.phase !== 'ended') {
        const actions = mission.turns[state.turnIndex]!.actions;
        const pick = actions[Math.min(slot, actions.length - 1)]!;
        try {
          state = play(state, pick.id);
        } catch {
          break;
        }
      }
      expect(state.outcome).not.toBe('success');
    }
  });

  it('makes every non-trap action part of at least one winning path', () => {
    const usedInWins = new Set(wins.flatMap((path) => path.ids));
    const unused = allActionIds.filter((id) => !TRAP_ACTION_IDS.includes(id) && !usedInWins.has(id));
    expect(unused).toEqual([]);
  });

  it('never lets a trap action appear in a winning path', () => {
    expect(wins.some((path) => path.ids.some((id) => TRAP_ACTION_IDS.includes(id)))).toBe(false);
  });

  it('can end honestly in every way: success, partial and each pause reason', () => {
    const endings = new Set(paths.map((path) => `${path.final.outcome}:${path.final.pauseReason ?? '-'}`));
    expect([...endings].sort()).toEqual(['partial:-', 'paused:oxygen', 'paused:power', 'paused:safety-rule', 'success:-']);
  });

  it('has no free safe choice: every action costs a resource or gives up a sample', () => {
    for (const turn of mission.turns) {
      const best = Math.max(...turn.actions.map((action) => action.delta.samples ?? 0));
      for (const action of turn.actions) {
        const spends = (action.delta.power ?? 0) < 0 || (action.delta.oxygen ?? 0) < 0;
        const givesUpSample = (action.delta.samples ?? 0) < best;
        expect(spends || givesUpSample || action.breaksSafetyRule === true).toBe(true);
      }
    }
  });

  it('keeps success rare enough to need thought but common enough to find', () => {
    const ratio = wins.length / paths.length;
    expect(ratio).toBeGreaterThan(0.03);
    expect(ratio).toBeLessThan(0.35);
  });
});
