import { forwardRef } from 'react';
import { actionCopy, kindCopy, principleCopy, RUSHED_NOTE, turnCopy, UPKEEP_NOTE } from '../content/copy';
import { evidenceLine } from '../content/evidence';
import { getSource } from '../data';
import type { GameState, MissionDef } from '../game/types';
import { DeltaChips } from './Chips';
import { Icon, type IconName } from './Icon';

const KIND_ICON: Record<string, IconName> = { observation: 'eye', 'curated-analysis': 'eye', 'model-output': 'model', 'educational-resource': 'book', 'game-assumption': 'gear' };

interface Props {
  state: GameState;
  mission: MissionDef;
  onNext: () => void;
  onOpenSource: (id: string) => void;
}

/** After each decision: what happened, then what was observed, the science idea, and what is only a game rule. */
export const Explanation = forwardRef<HTMLHeadingElement, Props>(function Explanation({ state, mission, onNext, onOpenSource }, headingRef) {
  const decision = state.decisionLog[state.decisionLog.length - 1]!;
  const turn = mission.turns[decision.turnIndex]!;
  const action = turn.actions.find((item) => item.id === decision.actionId)!;
  const ids = [...new Set([...turn.evidenceIds, ...action.sourceIds, 'assumption-game-units'])];
  const ended = state.outcome !== 'in-progress';
  return (
    <section className="explanation" aria-labelledby="explanation-title" data-testid="explanation">
      <h2 id="explanation-title" ref={headingRef} tabIndex={-1}>
        What happened
      </h2>
      <p className="explanation-happened">
        {actionCopy[action.id]!.happened} {decision.rushed ? RUSHED_NOTE : ''}
      </p>
      <p className="explanation-deltas">
        <DeltaChips delta={decision.applied} />
        <span className="explanation-upkeep">{UPKEEP_NOTE}</span>
      </p>
      <ul className="evidence-rows">
        {ids.map((id) => {
          const line = evidenceLine(id);
          const record = getSource(id);
          return (
            <li key={id} className="evidence-row" data-kind={record.kind}>
              <span className="evidence-row-tag">
                <Icon name={KIND_ICON[record.kind] ?? 'info'} size={18} />
                {kindCopy[record.kind].tag}
              </span>
              <span className="evidence-row-text">
                {line.claim}{' '}
                <button type="button" className="link-button" onClick={() => onOpenSource(id)}>
                  Source<span className="visually-hidden">: {line.headline}</span>
                </button>
              </span>
            </li>
          );
        })}
        <li className="evidence-row" data-kind="science-idea">
          <span className="evidence-row-tag">
            <Icon name="book" size={18} />
            Science idea
          </span>
          <span className="evidence-row-text">{principleCopy[action.principleId]}</span>
        </li>
      </ul>
      <p className="explanation-lesson">{turnCopy[turn.id]?.lesson}</p>
      <div className="confirm-bar">
        <button type="button" className="button button-primary" onClick={onNext} data-testid="next">
          {ended ? 'See how the mission went' : 'Next turn'} <Icon name="arrow" />
        </button>
      </div>
    </section>
  );
});
