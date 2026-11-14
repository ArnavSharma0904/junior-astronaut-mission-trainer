import type { Delta } from '../game/types';

const LABELS = { power: 'Power', oxygen: 'Oxygen', samples: 'Samples' } as const;

/** Signed change chips. The arrow glyph and the sign carry direction, so colour is never the only cue. */
export function DeltaChips({ delta, note }: { delta: Required<Delta> | { power: number; oxygen: number; samples?: number }; note?: string }) {
  const entries = (['power', 'oxygen', 'samples'] as const).map((key) => [key, delta[key] ?? 0] as const).filter(([, value]) => value !== 0);
  if (entries.length === 0 && !note) return <span className="chip chip-neutral">No change</span>;
  return (
    <span className="chips">
      {entries.map(([key, value]) => (
        <span key={key} className={`chip ${value > 0 ? 'chip-up' : 'chip-down'}`} data-resource={key}>
          <span aria-hidden="true">{value > 0 ? '▲' : '▼'}</span> {LABELS[key]} {value > 0 ? `+${value}` : `−${Math.abs(value)}`}
        </span>
      ))}
      {note ? <span className="chip chip-neutral">{note}</span> : null}
    </span>
  );
}
