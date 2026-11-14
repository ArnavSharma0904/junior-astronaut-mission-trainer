import { useEffect, useRef } from 'react';
import { turnCopy, weatherCopy } from '../content/copy';
import { actionPreviews, isCritical } from '../game/selectors';
import type { GameEvent, GameState, MissionDef } from '../game/types';
import { SceneHost } from '../scene/SceneHost';
import { toSceneModel } from '../scene/sceneModel';
import { ActionList } from './ActionList';
import { Explanation } from './Explanation';
import { Icon } from './Icon';
import { Meters } from './Meters';
import { Timeline } from './Timeline';

interface Props {
  state: GameState;
  mission: MissionDef;
  dispatch: (event: GameEvent) => unknown;
  onOpenSource: (id: string) => void;
  onTone: (tone: 'select' | 'confirm') => void;
}

export function Console({ state, mission, dispatch, onOpenSource, onTone }: Props) {
  const turn = mission.turns[state.turnIndex]!;
  const copy = turnCopy[turn.id]!;
  const previews = actionPreviews(state, mission);
  const inspected = previews.find((preview) => preview.action.id === state.inspecting) ?? null;
  const deciding = state.phase === 'situation' || state.phase === 'inspecting' || state.phase === 'resolving';
  const situationHeading = useRef<HTMLHeadingElement>(null);
  const explanationHeading = useRef<HTMLHeadingElement>(null);

  // Predictable focus: to the new situation at the start of each turn, to the explanation once a decision has resolved.
  useEffect(() => {
    if (state.phase === 'situation') situationHeading.current?.focus();
    if (state.phase === 'explained') explanationHeading.current?.focus();
  }, [state.phase, state.turnIndex]);

  return (
    <div className="console" data-phase={state.phase} data-critical={isCritical(state)}>
      <div className="console-scene">
        <SceneHost model={toSceneModel(state, mission)} />
        <Meters state={state} mission={mission} preview={deciding ? inspected : null} />
        <Timeline state={state} mission={mission} onOpenSource={onOpenSource} />
      </div>
      <div className="console-decision" id="decision">
        <section className="situation" aria-labelledby="situation-title">
          <p className="situation-kicker mono">
            Turn {state.turnIndex + 1} of {mission.turns.length}
          </p>
          <h1 id="situation-title" ref={situationHeading} tabIndex={-1}>
            {copy.title}
          </h1>
          <p className="situation-text">{copy.situation}</p>
          <p className="situation-weather" data-state={state.spaceWeather}>
            <Icon name="sun" size={18} /> {weatherCopy[state.spaceWeather].description}
          </p>
          {isCritical(state) ? (
            <p className="critical-banner" data-testid="critical">
              <Icon name="warning" /> A reserve is running low. Choose carefully.
            </p>
          ) : null}
        </section>
        {deciding ? (
          <ActionList
            previews={previews}
            selectedId={state.inspecting}
            resolving={state.phase === 'resolving'}
            onSelect={(id) => {
              onTone('select');
              dispatch({ type: 'INSPECT', actionId: id });
            }}
            onConfirm={() => {
              if (!state.inspecting) return;
              onTone('confirm');
              dispatch({ type: 'COMMIT', actionId: state.inspecting });
            }}
          />
        ) : (
          <Explanation ref={explanationHeading} state={state} mission={mission} onNext={() => dispatch({ type: 'NEXT' })} onOpenSource={onOpenSource} />
        )}
      </div>
    </div>
  );
}
