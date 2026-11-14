import { MISSION_NAME, OBJECTIVE } from '../content/copy';
import type { MissionDef } from '../game/types';
import { SceneHost } from '../scene/SceneHost';
import { BRIEFING_SCENE } from '../scene/sceneModel';
import type { SaveStatus } from '../state/useMission';
import { Icon } from './Icon';

interface Props {
  mission: MissionDef;
  canResume: boolean;
  saveStatus: SaveStatus;
  onStart: () => void;
  onResume: () => void;
}

export function Briefing({ mission, canResume, saveStatus, onStart, onResume }: Props) {
  return (
    <div className="briefing">
      <SceneHost model={BRIEFING_SCENE} dimmed />
      <section className="briefing-card" aria-labelledby="briefing-title">
        <p className="briefing-kicker mono">Moon base mission briefing</p>
        <h1 id="briefing-title">{MISSION_NAME}</h1>
        <p className="briefing-lead">
          You are the junior flight engineer at a small base near the Moon&apos;s south pole. The Sun is getting stormy. {OBJECTIVE}
        </p>
        <ul className="briefing-manage" aria-label="What you look after">
          <li>
            <Icon name="bolt" size={24} />
            <strong>Power</strong>
            <span>Runs everything.</span>
          </li>
          <li>
            <Icon name="leaf" size={24} />
            <strong>Oxygen</strong>
            <span>The crew breathes it.</span>
          </li>
          <li>
            <Icon name="shield" size={24} />
            <strong>Crew safety</strong>
            <span>Shelter in a storm.</span>
          </li>
        </ul>
        <p className="briefing-goal">
          Goal: <strong>{mission.goalSamples} ice samples</strong> in <strong>{mission.turns.length} turns</strong>, with power and oxygen left over. Every choice costs something.
        </p>
        <p className="briefing-real">
          <Icon name="eye" size={18} /> The space weather in this mission really happened. It comes from NASA&apos;s archived records for 9 to 11 May 2024.
        </p>
        {saveStatus === 'unreadable' ? (
          <p className="notice" role="status" data-testid="save-unreadable">
            <Icon name="warning" size={18} /> A saved mission could not be loaded, so it was set aside. You can start fresh.
          </p>
        ) : null}
        <div className="briefing-actions">
          {canResume ? (
            <>
              <button type="button" className="button button-primary button-large" onClick={onResume} data-testid="resume">
                Continue mission
              </button>
              <button type="button" className="button button-large" onClick={onStart} data-testid="start">
                Start over
              </button>
            </>
          ) : (
            <button type="button" className="button button-primary button-large" onClick={onStart} data-testid="start">
              Start mission <Icon name="arrow" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
