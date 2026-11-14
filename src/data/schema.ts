import { z } from 'zod';

/** DONKI times are UTC to the minute, for example 2024-05-11T01:23Z. */
export const donkiTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/);
const isoInstant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const querySchema = z.strictObject({
  id: z.string().min(1),
  url: z.string().startsWith('https://ccmc.gsfc.nasa.gov/DONKI-API/get/'),
  httpStatus: z.literal(200),
  contentType: z.string().startsWith('application/json'),
  bytes: z.number().int().positive(),
  sha256,
  retrievedAt: isoInstant,
  recordCount: z.number().int().positive(),
});

const eventBase = { rawId: z.string().min(1), queryId: z.string().min(1), timeUtc: donkiTime, isModelDerived: z.boolean() };

export const eventSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('FLR'),
    ...eventBase,
    peakTimeUtc: donkiTime,
    endTimeUtc: donkiTime,
    classType: z.string().regex(/^[ABCMX]\d+(\.\d+)?$/),
    sourceLocation: z.string().min(1),
    activeRegionNum: z.number().int().positive(),
    instrument: z.string().min(1),
    upstreamVersionId: z.number().int().positive(),
  }),
  z.strictObject({
    type: z.literal('SEP'),
    ...eventBase,
    instrument: z.string().min(1),
    upstreamVersionId: z.number().int().positive(),
    linkedRawIds: z.array(z.string().min(1)).optional(),
    linkedCount: z.number().int().positive().optional(),
  }),
  z.strictObject({
    type: z.literal('CME'),
    ...eventBase,
    upstreamVersionId: z.number().int().positive(),
    analyses: z.array(
      z.strictObject({ isMostAccurate: z.boolean(), time21_5: donkiTime, speedKmS: z.number().positive(), halfAngleDeg: z.number().positive(), type: z.string().min(1) }),
    ),
  }),
  z.strictObject({
    type: z.literal('ENLIL'),
    ...eventBase,
    enlil: z.strictObject({
      modelCompletionTime: donkiTime,
      estimatedShockArrivalTime: donkiTime.nullable(),
      estimatedDurationHours: z.number().positive().nullable(),
      cmeInputCount: z.number().int().min(0),
      target: z.literal('Earth'),
      includesCmeStart: donkiTime,
    }),
  }),
]);

export const snapshotSchema = z
  .strictObject({
    snapshotVersion: z.string().min(1),
    createdAt: isoInstant,
    tool: z.string().min(1),
    transformationVersion: z.string().min(1),
    queries: z.array(querySchema).min(1),
    // An empty array is a valid API response but never a valid committed snapshot.
    events: z.array(eventSchema).min(1),
  })
  .superRefine((snapshot, context) => {
    const queryIds = new Set(snapshot.queries.map((query) => query.id));
    const seen = new Set<string>();
    for (const event of snapshot.events) {
      if (!queryIds.has(event.queryId)) context.addIssue({ code: 'custom', message: `Event ${event.rawId} names unknown query ${event.queryId}` });
      if (seen.has(event.rawId)) context.addIssue({ code: 'custom', message: `Duplicate event ${event.rawId}` });
      seen.add(event.rawId);
      // Forecast-model records must never pass as observations.
      const looksModelled = event.type === 'ENLIL' || (event.type === 'SEP' && event.instrument.startsWith('MODEL:'));
      if (looksModelled !== event.isModelDerived) context.addIssue({ code: 'custom', message: `Event ${event.rawId} has the wrong isModelDerived flag` });
    }
  });

export const sourceRecordSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  agency: z.enum(['NASA', 'CSA']).nullable(),
  provider: z.string().min(1),
  datasetId: z.string().nullable(),
  recordUrl: z.string().startsWith('https://').nullable(),
  apiUrl: z.string().startsWith('https://').nullable(),
  rawIds: z.array(z.string().min(1)),
  retrievedAt: isoInstant.nullable(),
  observedAt: donkiTime.nullable(),
  kind: z.enum(['observation', 'model-output', 'curated-analysis', 'educational-resource', 'game-assumption']),
  originalUnits: z.string().nullable(),
  transformedUnits: z.string().nullable(),
  supportedClaim: z.string().min(10),
  notSupported: z.array(z.string().min(1)).min(1),
  usageNotes: z.string().min(1),
  transformationVersion: z.string().min(1),
  contentSha256: sha256.nullable(),
  // 'live' is deliberately absent: this app never shows live data.
  status: z.enum(['snapshot', 'reference']),
});

export const sourceManifestSchema = z.strictObject({
  snapshotVersion: z.string().min(1),
  records: z.array(sourceRecordSchema).min(1),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
export type NormalizedEvent = z.infer<typeof eventSchema>;
export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type SourceManifest = z.infer<typeof sourceManifestSchema>;
