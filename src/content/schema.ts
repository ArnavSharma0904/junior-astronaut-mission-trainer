import { z } from 'zod';

const delta = z.strictObject({ power: z.number().int().optional(), oxygen: z.number().int().optional(), samples: z.number().int().min(0).optional() });
const requirement = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('minPower'), value: z.number().int().min(1).max(100) }),
  z.strictObject({ kind: z.literal('shelterStocked') }),
  z.strictObject({ kind: z.literal('shelterNotStocked') }),
]);
const action = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  delta,
  deltaIfUnstocked: delta.optional(),
  sets: z.strictObject({ shelterStocked: z.literal(true).optional(), crew: z.enum(['working', 'sheltered']).optional() }).optional(),
  requires: z.array(requirement).optional(),
  breaksSafetyRule: z.literal(true).optional(),
  principleId: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
});

export const missionSchema = z.strictObject({
  id: z.string().min(1),
  start: z.strictObject({ power: z.number().int().min(1).max(100), oxygen: z.number().int().min(1).max(100) }),
  upkeep: z.strictObject({ power: z.number().int().min(0), oxygen: z.number().int().min(0) }),
  goalSamples: z.number().int().min(1),
  reserve: z.strictObject({ power: z.number().int().min(0), oxygen: z.number().int().min(0) }),
  turns: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9-]+$/),
        weather: z.enum(['quiet', 'watch', 'storm', 'clearing']),
        evidenceIds: z.array(z.string().min(1)).min(1),
        actions: z.array(action).min(2).max(3),
      }),
    )
    .min(4)
    .max(6),
});
