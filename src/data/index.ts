import rawSnapshot from './donki-snapshot.json';
import { snapshotSchema, sourceManifestSchema, type NormalizedEvent, type SourceRecord } from './schema';
import rawSources from './sources.json';

/**
 * The committed, archived NASA snapshot. Parsed strictly at start-up so a corrupted bundle fails loudly
 * instead of showing wrong science. There is no runtime network request anywhere in the app.
 */
export const snapshot = snapshotSchema.parse(rawSnapshot);
export const sources = sourceManifestSchema.parse(rawSources);
export const SNAPSHOT_VERSION: string = snapshot.snapshotVersion;

const byRawId = new Map<string, NormalizedEvent>(snapshot.events.map((event) => [event.rawId, event]));
const bySourceId = new Map<string, SourceRecord>(sources.records.map((record) => [record.id, record]));

export function getSource(id: string): SourceRecord {
  const record = bySourceId.get(id);
  if (!record) throw new Error(`Unknown source id: ${id}`);
  return record;
}

export function getEvent(rawId: string): NormalizedEvent {
  const event = byRawId.get(rawId);
  if (!event) throw new Error(`Unknown archived record: ${rawId}`);
  return event;
}

export function eventsForSource(id: string): NormalizedEvent[] {
  return getSource(id).rawIds.filter((rawId) => byRawId.has(rawId)).map(getEvent);
}
