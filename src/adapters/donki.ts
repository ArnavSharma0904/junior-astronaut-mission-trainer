import { z } from 'zod';
import type { NormalizedEvent } from '../data/schema';

/**
 * Pure normalizers from raw DONKI API records to the snapshot shape. No network here: fetching is done
 * only by scripts/data. Only documented fields are kept; `sentNotifications` and links are dropped.
 */
export class DonkiFormatError extends Error {}

const linked = z.array(z.looseObject({ activityID: z.string() })).nullable().optional();
const instruments = z.array(z.looseObject({ displayName: z.string() })).min(1);

const rawFlare = z.looseObject({
  flrID: z.string(), beginTime: z.string(), peakTime: z.string(), endTime: z.string(), classType: z.string(),
  sourceLocation: z.string(), activeRegionNum: z.number(), instruments, versionId: z.number(), linkedEvents: linked,
});
const rawSep = z.looseObject({ sepID: z.string(), eventTime: z.string(), instruments, versionId: z.number(), linkedEvents: linked });
const rawCme = z.looseObject({
  activityID: z.string(), startTime: z.string(), versionId: z.number(),
  cmeAnalyses: z.array(z.looseObject({ isMostAccurate: z.boolean(), time21_5: z.string(), speed: z.number(), halfAngle: z.number(), type: z.string() })).nullable().optional(),
});
const rawEnlil = z.looseObject({
  simulationID: z.string(), modelCompletionTime: z.string(), estimatedShockArrivalTime: z.string().nullable(),
  estimatedDuration: z.number().nullable(), cmeInputs: z.array(z.looseObject({ cmeStartTime: z.string() })).nullable().optional(),
});

/** Parses a response body. Rejects HTML error pages, malformed JSON and non-array payloads. `[]` is valid and stays empty. */
export function parseDonkiBody(body: string): unknown[] {
  const trimmed = body.trimStart();
  if (trimmed.startsWith('<')) throw new DonkiFormatError('Response is HTML, not JSON (probably an error page)');
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new DonkiFormatError('Response is not valid JSON');
  }
  if (!Array.isArray(parsed)) throw new DonkiFormatError('Response is not a JSON array');
  return parsed;
}

function check<T>(schema: z.ZodType<T>, record: unknown, label: string): T {
  const result = schema.safeParse(record);
  if (!result.success) throw new DonkiFormatError(`${label} record is missing required fields: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
  return result.data;
}

const linkedIds = (value: { activityID: string }[] | null | undefined): string[] => (value ?? []).map((item) => item.activityID);

export function normalizeFlares(records: unknown[], queryId: string): NormalizedEvent[] {
  return records.map((record) => {
    const flare = check(rawFlare, record, 'FLR');
    return {
      type: 'FLR', rawId: flare.flrID, queryId, timeUtc: flare.beginTime, peakTimeUtc: flare.peakTime, endTimeUtc: flare.endTime,
      classType: flare.classType, sourceLocation: flare.sourceLocation, activeRegionNum: flare.activeRegionNum,
      instrument: flare.instruments.map((item) => item.displayName).join(' + '), isModelDerived: false, upstreamVersionId: flare.versionId,
    };
  });
}

export function normalizeSeps(records: unknown[], queryId: string, keepLinksFor: readonly string[] = []): NormalizedEvent[] {
  return records.map((record) => {
    const sep = check(rawSep, record, 'SEP');
    const names = sep.instruments.map((item) => item.displayName);
    const modelled = names.some((name) => name.startsWith('MODEL:'));
    const observed = names.some((name) => !name.startsWith('MODEL:'));
    if (modelled && observed) throw new DonkiFormatError('SEP mixes an observation instrument with a model instrument');
    const instrument = names.join(' + ');
    const ids = linkedIds(sep.linkedEvents);
    const kept = ids.filter((id) => keepLinksFor.includes(id));
    return {
      type: 'SEP', rawId: sep.sepID, queryId, timeUtc: sep.eventTime, instrument,
      // DONKI lists forecast-model particle alerts next to measured ones. They must stay labelled as model output.
      isModelDerived: modelled, upstreamVersionId: sep.versionId,
      ...(kept.length > 0 ? { linkedRawIds: kept, linkedCount: ids.length } : {}),
    };
  });
}

export function normalizeCmes(records: unknown[], queryId: string, only: readonly string[]): NormalizedEvent[] {
  return records
    .map((record) => check(rawCme, record, 'CME'))
    .filter((cme) => only.includes(cme.activityID))
    .map((cme) => ({
      type: 'CME', rawId: cme.activityID, queryId, timeUtc: cme.startTime, isModelDerived: false, upstreamVersionId: cme.versionId,
      // Every analysis is kept. DONKI can mark more than one as "most accurate", so no single speed is chosen.
      analyses: (cme.cmeAnalyses ?? []).map((analysis) => ({
        isMostAccurate: analysis.isMostAccurate, time21_5: analysis.time21_5, speedKmS: analysis.speed, halfAngleDeg: analysis.halfAngle, type: analysis.type,
      })),
    }));
}

export function normalizeEnlil(records: unknown[], queryId: string, cmeStartPrefix: string): NormalizedEvent[] {
  return records
    .map((record) => check(rawEnlil, record, 'WSA-ENLIL'))
    .filter((run) => (run.cmeInputs ?? []).some((input) => input.cmeStartTime.startsWith(cmeStartPrefix)))
    .map((run) => ({
      type: 'ENLIL', rawId: run.simulationID, queryId, timeUtc: run.modelCompletionTime, isModelDerived: true,
      enlil: {
        modelCompletionTime: run.modelCompletionTime, estimatedShockArrivalTime: run.estimatedShockArrivalTime,
        estimatedDurationHours: run.estimatedDuration, cmeInputCount: (run.cmeInputs ?? []).length, target: 'Earth',
        includesCmeStart: `${cmeStartPrefix}Z`,
      },
    }));
}

/** Minutes between two DONKI minute-resolution UTC times. */
export function minutesBetween(fromUtc: string, toUtc: string): number {
  const parse = (value: string) => Date.parse(value.replace(/Z$/, ':00Z'));
  return Math.round((parse(toUtc) - parse(fromUtc)) / 60000);
}
