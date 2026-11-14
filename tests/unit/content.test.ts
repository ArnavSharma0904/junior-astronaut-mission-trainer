import { describe, expect, it } from 'vitest';
import { mission } from '../../src/content/mission';
import { missionSchema } from '../../src/content/schema';

describe('mission content', () => {
  it('matches the strict content schema', () => {
    expect(missionSchema.safeParse(mission).success).toBe(true);
  });

  it('rejects content with unknown fields or missing sources', () => {
    const first = mission.turns[0]!.actions[0]!;
    const withExtra = { ...mission, turns: [{ ...mission.turns[0]!, actions: [{ ...first, healthEffect: 'none' }, ...mission.turns[0]!.actions.slice(1)] }, ...mission.turns.slice(1)] };
    expect(missionSchema.safeParse(withExtra).success).toBe(false);
    const noSource = { ...mission, turns: [{ ...mission.turns[0]!, actions: [{ ...first, sourceIds: [] }, ...mission.turns[0]!.actions.slice(1)] }, ...mission.turns.slice(1)] };
    expect(missionSchema.safeParse(noSource).success).toBe(false);
  });

  it('uses unique action and turn ids', () => {
    const actionIds = mission.turns.flatMap((turn) => turn.actions.map((action) => action.id));
    expect(new Set(actionIds).size).toBe(actionIds.length);
    expect(new Set(mission.turns.map((turn) => turn.id)).size).toBe(mission.turns.length);
  });

  it('shelters the crew in every non-trap storm action', () => {
    const storm = mission.turns.find((turn) => turn.id === 'particle-storm')!;
    for (const action of storm.actions) {
      expect(action.breaksSafetyRule === true || action.sets?.crew === 'sheltered').toBe(true);
    }
  });
});
