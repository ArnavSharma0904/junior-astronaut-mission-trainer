import { turnCopy } from '../content/copy';
import { evidenceLine } from '../content/evidence';
import type { GameState, MissionDef } from '../game/types';
import { Icon } from './Icon';

/** Mission timeline. Past and current turns show the real archived records behind them; future turns stay hidden. */
export function Timeline({ state, mission, onOpenSource }: { state: GameState; mission: MissionDef; onOpenSource: (id: string) => void }) {
  return (
    <section className="timeline" aria-label="Mission timeline">
      <p className="timeline-note">
        <Icon name="info" size={16} /> Archived NASA record from May 2024. Not live.
      </p>
      <ol>
        {mission.turns.map((turn, index) => {
          const status = index < state.turnIndex ? 'done' : index === state.turnIndex ? 'current' : 'upcoming';
          return (
            <li key={turn.id} className="timeline-turn" data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
              <span className="timeline-index mono">{index + 1}</span>
              {status === 'upcoming' ? (
                <span className="timeline-title">Still to come</span>
              ) : (
                <div className="timeline-body">
                  <span className="timeline-title">
                    {turnCopy[turn.id]?.title}
                    {status === 'current' ? <span className="timeline-here"> (you are here)</span> : null}
                  </span>
                  <span className="timeline-evidence">
                    {turn.evidenceIds.map((id) => {
                      const line = evidenceLine(id);
                      return (
                        <button key={id} type="button" className="evidence-chip" data-kind={line.kind} onClick={() => onOpenSource(id)}>
                          <span className="evidence-tag">{line.tag}</span>
                          <span className="evidence-headline">{line.headline}</span>
                          <span className="evidence-detail mono">{line.detail}</span>
                        </button>
                      );
                    })}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
