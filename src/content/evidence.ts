import { minutesBetween } from '../adapters/donki';
import { eventsForSource, getSource } from '../data';
import type { NormalizedEvent, SourceRecord } from '../data/schema';
import { kindCopy } from './copy';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-05-11T01:23Z" -> "11 May 2024, 01:23 UTC". Pure string formatting: no Date, no time zone surprises. */
export function formatUtc(time: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(time);
  if (!match) return time;
  const [, year, month, day, hour, minute] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${hour}:${minute} UTC`;
}

export function shortUtc(time: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(time);
  if (!match) return time;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[4]}:${match[5]}`;
}

export interface EvidenceLine {
  sourceId: string;
  tag: string;
  kind: SourceRecord['kind'];
  /** Short label for the timeline, built only from archived values. */
  headline: string;
  /** Mono-styled detail such as a UTC time. */
  detail: string;
  claim: string;
  isNasaRecord: boolean;
}

function headline(record: SourceRecord, events: NormalizedEvent[]): { headline: string; detail: string } {
  const first = events[0];
  if (record.kind === 'game-assumption') return { headline: 'Game rule', detail: 'Not a NASA record' };
  if (!first) return { headline: record.datasetId ?? record.provider, detail: record.provider };
  if (events.length > 1 && first.type === 'FLR') return { headline: `${events.length} X-class flares`, detail: `${shortUtc(first.timeUtc)} to ${shortUtc(events[events.length - 1]!.timeUtc)} UTC` };
  switch (first.type) {
    case 'FLR':
      return { headline: `${first.classType} flare`, detail: `Peak ${shortUtc(first.peakTimeUtc)} UTC` };
    case 'CME':
      return { headline: 'Solar cloud (CME)', detail: `Start ${shortUtc(first.timeUtc)} UTC` };
    case 'SEP':
      return { headline: 'Particle event', detail: `${shortUtc(first.timeUtc)} UTC` };
    case 'ENLIL':
      return {
        headline: 'Forecast model run',
        detail: first.enlil.estimatedShockArrivalTime ? `Guess: at Earth ${shortUtc(first.enlil.estimatedShockArrivalTime)} UTC` : `Run ${shortUtc(first.timeUtc)} UTC`,
      };
  }
}

export function evidenceLine(sourceId: string): EvidenceLine {
  const record = getSource(sourceId);
  const events = eventsForSource(sourceId);
  return {
    sourceId,
    kind: record.kind,
    tag: kindCopy[record.kind].tag,
    ...headline(record, events),
    claim: record.supportedClaim,
    isNasaRecord: record.agency === 'NASA' && record.status === 'snapshot',
  };
}

/** The one derived number in the game: minutes from the X5.8 flare peak to the particle-event record. */
export function warningGapMinutes(): number {
  const [flare] = eventsForSource('donki-flr-2024-05-11');
  const [particles] = eventsForSource('donki-sep-2024-05-11');
  if (flare?.type !== 'FLR' || !particles) throw new Error('Snapshot is missing the 11 May records');
  return minutesBetween(flare.peakTimeUtc, particles.timeUtc);
}
