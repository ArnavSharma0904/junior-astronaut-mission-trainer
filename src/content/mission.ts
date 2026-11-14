import type { MissionDef } from '../game/types';

/**
 * "Storm Watch": one authored mission. All numbers are GAME units chosen for teaching trade-offs.
 * They are not physical quantities and the weather stages are not radiation doses.
 * Balance is enforced by tests/unit/balance.test.ts, which enumerates every legal path.
 *
 * evidenceIds and sourceIds name entries in the source manifest (src/data, added in M03).
 * Ids starting with "assumption-" are game rules, not NASA records.
 */
export const mission: MissionDef = {
  id: 'storm-watch-v1',
  start: { power: 90, oxygen: 70 },
  upkeep: { power: 2, oxygen: 10 },
  goalSamples: 3,
  reserve: { power: 10, oxygen: 10 },
  turns: [
    {
      id: 'morning-check',
      weather: 'watch',
      evidenceIds: ['donki-flr-window-2024-05'],
      actions: [
        { id: 'drill-1', delta: { power: -16, samples: 1 }, principleId: 'trade-offs', sourceIds: ['assumption-game-units'] },
        { id: 'charge-1', delta: { power: 22 }, principleId: 'trade-offs', sourceIds: ['assumption-game-units'] },
        { id: 'grow-1', delta: { power: -8, oxygen: 18 }, principleId: 'plants-make-oxygen', sourceIds: ['osdr-osd-476', 'csa-food-toolkit'] },
      ],
    },
    {
      id: 'flare-seen',
      weather: 'watch',
      evidenceIds: ['donki-flr-2024-05-09', 'donki-cme-2024-05-09'],
      actions: [
        { id: 'drill-2', delta: { power: -16, samples: 1 }, principleId: 'flare-light-is-fast', sourceIds: ['donki-flr-2024-05-09'] },
        { id: 'stock-2', delta: { power: -6, oxygen: -8 }, sets: { shelterStocked: true }, principleId: 'prepare-early', sourceIds: ['donki-flr-2024-05-09'] },
        { id: 'charge-2', delta: { power: 14 }, principleId: 'flare-light-is-fast', sourceIds: ['donki-flr-2024-05-09'] },
      ],
    },
    {
      id: 'forecast-changes',
      weather: 'watch',
      evidenceIds: ['donki-enlil-run-a', 'donki-enlil-run-b'],
      actions: [
        { id: 'drill-3', delta: { power: -16, samples: 1 }, principleId: 'forecasts-change', sourceIds: ['donki-enlil-run-a', 'donki-enlil-run-b'] },
        { id: 'grow-3', delta: { power: -8, oxygen: 18 }, principleId: 'plants-make-oxygen', sourceIds: ['osdr-osd-476', 'csa-food-toolkit'] },
        {
          id: 'stock-3',
          delta: { power: -6, oxygen: -8 },
          sets: { shelterStocked: true },
          requires: [{ kind: 'shelterNotStocked' }],
          principleId: 'prepare-early',
          sourceIds: ['donki-enlil-run-a', 'donki-enlil-run-b'],
        },
      ],
    },
    {
      id: 'particle-storm',
      weather: 'storm',
      evidenceIds: ['donki-flr-2024-05-11', 'donki-sep-2024-05-11'],
      actions: [
        {
          id: 'shelter-4',
          delta: { power: -4 },
          deltaIfUnstocked: { power: -12, oxygen: -12 },
          sets: { crew: 'sheltered' },
          principleId: 'particles-follow-fast',
          sourceIds: ['donki-flr-2024-05-11', 'donki-sep-2024-05-11'],
        },
        {
          id: 'remote-4',
          delta: { power: -20, samples: 1 },
          sets: { crew: 'sheltered' },
          requires: [{ kind: 'shelterStocked' }, { kind: 'minPower', value: 30 }],
          principleId: 'particles-follow-fast',
          sourceIds: ['donki-flr-2024-05-11', 'donki-sep-2024-05-11'],
        },
        { id: 'outside-4', delta: { samples: 1 }, breaksSafetyRule: true, principleId: 'shelter-rule', sourceIds: ['assumption-safety-rule'] },
      ],
    },
    {
      id: 'storm-continues',
      weather: 'storm',
      evidenceIds: ['donki-sep-stereo-2024-05-11'],
      actions: [
        { id: 'rest-5', delta: { power: -2, oxygen: -6 }, principleId: 'shelter-slows-work', sourceIds: ['assumption-safety-rule'] },
        { id: 'remote-5', delta: { power: -20, samples: 1 }, requires: [{ kind: 'minPower', value: 30 }], principleId: 'shelter-slows-work', sourceIds: ['assumption-safety-rule'] },
        { id: 'reserve-5', delta: { power: -14, oxygen: 16 }, principleId: 'reserve-oxygen', sourceIds: ['assumption-game-units'] },
      ],
    },
    {
      id: 'all-clear',
      weather: 'clearing',
      evidenceIds: ['assumption-all-clear'],
      actions: [
        { id: 'drill-6', delta: { power: -16, samples: 1 }, sets: { crew: 'working' }, principleId: 'rebuild-reserves', sourceIds: ['assumption-all-clear'] },
        { id: 'repair-6', delta: { power: 18 }, sets: { crew: 'working' }, principleId: 'rebuild-reserves', sourceIds: ['assumption-all-clear'] },
        { id: 'grow-6', delta: { power: -8, oxygen: 18 }, sets: { crew: 'working' }, principleId: 'plants-make-oxygen', sourceIds: ['osdr-osd-476', 'csa-food-toolkit'] },
      ],
    },
  ],
};

export const TRAP_ACTION_IDS: readonly string[] = ['outside-4'];
