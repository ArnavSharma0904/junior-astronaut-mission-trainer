import { DonkiFormatError, normalizeCmes, normalizeEnlil, normalizeFlares, normalizeSeps, parseDonkiBody } from '../../src/adapters/donki';
import { eventSchema } from '../../src/data/schema';

export type AcquisitionAssessment =
  | { ok: true; empty: boolean; recordCount: number }
  | { ok: false; reason: 'schema' | 'route'; detail: string };

/**
 * Checks one downloaded DONKI body with that route's normalizer and the normalized event schema.
 * An empty array is a legitimate empty result. It does not replace the curated snapshot.
 * This is not the packaged-fixture check in data:validate.
 */
export function assessAcquiredBody(route: string, body: string): AcquisitionAssessment {
  let parsed: unknown[];
  try {
    parsed = parseDonkiBody(body);
  } catch (error) {
    return { ok: false, reason: 'schema', detail: error instanceof Error ? error.message : 'unreadable' };
  }
  if (parsed.length === 0) return { ok: true, empty: true, recordCount: 0 };
  try {
    const normalized = normalizeRoute(route, parsed);
    if (normalized.length === 0 && route !== 'flr' && route !== 'sep') return { ok: true, empty: true, recordCount: 0 };
    for (const event of normalized) {
      const checked = eventSchema.safeParse(event);
      if (!checked.success) return { ok: false, reason: 'schema', detail: checked.error.issues.map((issue) => issue.path.join('.')).join(', ') };
    }
    return { ok: true, empty: normalized.length === 0, recordCount: normalized.length };
  } catch (error) {
    if (error instanceof DonkiFormatError) return { ok: false, reason: 'schema', detail: error.message };
    return { ok: false, reason: 'route', detail: error instanceof Error ? error.message : 'route' };
  }
}

function normalizeRoute(route: string, parsed: unknown[]) {
  if (route === 'flr') return normalizeFlares(parsed, route);
  if (route === 'sep') return normalizeSeps(parsed, route);
  if (route === 'cme') return normalizeCmes(parsed, route, parsed.flatMap((row) => (row && typeof row === 'object' && 'activityID' in row ? [String(row.activityID)] : [])));
  if (route === 'enlil') return normalizeEnlil(parsed, route, '2024-05-09T09:24');
  throw new Error(`Unknown route ${route}`);
}
