import { z } from 'zod';

const resource = z.number().int().min(0).max(100);
const delta = z.strictObject({ power: z.number().int(), oxygen: z.number().int(), samples: z.number().int() });

export const gameStateSchema = z.strictObject({
  schemaVersion: z.literal(1),
  missionId: z.string().min(1),
  snapshotVersion: z.string().min(1),
  turnIndex: z.number().int().min(0),
  phase: z.enum(['situation', 'inspecting', 'resolving', 'explained', 'ended']),
  inspecting: z.string().nullable(),
  resources: z.strictObject({ power: resource, oxygen: resource }),
  samples: z.number().int().min(0),
  shelterStocked: z.boolean(),
  crew: z.enum(['working', 'sheltered']),
  spaceWeather: z.enum(['quiet', 'watch', 'storm', 'clearing']),
  decisionLog: z.array(
    z.strictObject({
      turnIndex: z.number().int().min(0),
      actionId: z.string().min(1),
      applied: delta,
      rushed: z.boolean(),
      after: z.strictObject({ power: resource, oxygen: resource, samples: z.number().int().min(0) }),
    }),
  ),
  outcome: z.enum(['in-progress', 'success', 'partial', 'paused']),
  pauseReason: z.enum(['power', 'oxygen', 'safety-rule']).nullable(),
});

export const saveSchema = z.strictObject({
  schemaVersion: z.literal(1),
  snapshotVersion: z.string().min(1),
  state: gameStateSchema,
});
