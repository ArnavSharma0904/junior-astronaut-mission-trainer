import { useEffect, useRef } from 'react';
import { actionCopy, endingCopy, missingCopy, pauseCopy, turnCopy } from '../content/copy';
import { debrief } from '../game/selectors';
import type { GameState, MissionDef } from '../game/types';
import { SceneHost } from '../scene/SceneHost';
import { toSceneModel } from '../scene/sceneModel';
import { DeltaChips } from './Chips';
import { Icon } from './Icon';
import { Meters } from './Meters';

interface Props {
  state: GameState;
  mission: MissionDef;
  onReplay: () => void;
  onSources: () => void;
  onHome: () => void;
}

/** An honest debrief: what the outcome was, exactly why, and what each decision did. No score. */
export function Debrief({ state, mission, onReplay, onSources, onHome }: Props) {
  const summary = debrief(state, mission);
  const outcome = summary.outcome === 'in-progress' ? 'partial' : summary.outcome;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const missing = (['samples', 'power', 'oxygen'] as const).filter((key) => summary.missing[key]);
  return (
    <div className="debrief" data-outcome={outcome}>
      <div className="console-scene">
        <SceneHost model={toSceneModel(state, mission)} />
        <Meters state={state} mission={mission} preview={null} />
      </div>
      <section className="debrief-panel" aria-labelledby="debrief-title">
        <p className="situation-kicker mono">Mission debrief</p>
        <h1 id="debrief-title" ref={heading} tabIndex={-1} data-testid="outcome">
          {endingCopy[outcome].heading}
        </h1>
        <p className="debrief-body">{endingCopy[outcome].body}</p>
        {summary.pauseReason ? (
          <p className="debrief-reason" data-testid="pause-reason">
            <Icon name="warning" /> {pauseCopy[summary.pauseReason]}
          </p>
        ) : null}
        {outcome === 'partial' && missing.length > 0 ? (
          <ul className="debrief-missing" data-testid="missing">
            {missing.map((key) => (
              <li key={key}>
                <Icon name="warning" size={18} /> {missingCopy[key]}
              </li>
            ))}
          </ul>
        ) : null}
        <h2>Your decisions</h2>
        <ol className="decision-log" data-testid="decision-log">
          {state.decisionLog.map((decision) => {
            const turn = mission.turns[decision.turnIndex]!;
            return (
              <li key={decision.turnIndex}>
                <span className="log-turn mono">{decision.turnIndex + 1}</span>
                <div>
                  <p className="log-choice">
                    <strong>{turnCopy[turn.id]?.title}:</strong> {actionCopy[decision.actionId]?.label}
                    {decision.rushed ? ' (rushed)' : ''}
                  </p>
                  <DeltaChips delta={decision.applied} />
                  <p className="log-lesson">{turnCopy[turn.id]?.lesson}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="debrief-hint">There is more than one way to finish this mission. Try a different plan and see what changes.</p>
        <div className="debrief-actions">
          <button type="button" className="button button-primary button-large" onClick={onReplay} data-testid="replay">
            Play again
          </button>
          <button type="button" className="button" onClick={onSources}>
            <Icon name="sources" /> See the sources
          </button>
          <button type="button" className="button" onClick={onHome} data-testid="home">
            Back to the briefing
          </button>
        </div>
      </section>
    </div>
  );
}
