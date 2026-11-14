import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutDrawer } from './components/AboutDrawer';
import { Briefing } from './components/Briefing';
import { Console } from './components/Console';
import { Debrief } from './components/Debrief';
import { Icon } from './components/Icon';
import { LiveRegion } from './components/LiveRegion';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SourcesDrawer } from './components/SourcesDrawer';
import { DISCLAIMER, GAME_TITLE, OBJECTIVE, endingCopy, pauseCopy } from './content/copy';
import { mission } from './content/mission';
import type { ConsequenceEvent, GameState } from './game/types';
import { useSettings } from './state/settings';
import { playTone } from './state/sound';
import { useMission } from './state/useMission';

type DrawerName = 'sources' | 'settings' | 'about' | null;

/** One sentence per decision for screen readers, built from the same events the scene and meters use. */
function announce(events: ConsequenceEvent[], state: GameState): string {
  const parts: string[] = [];
  for (const event of events) {
    if (event.kind === 'resource' && event.from !== event.to) parts.push(`${event.resource === 'power' ? 'Power' : 'Oxygen'} ${event.to > event.from ? 'up' : 'down'} to ${event.to}.`);
    if (event.kind === 'samples') parts.push(`Ice samples: ${event.to} of ${mission.goalSamples}.`);
    if (event.kind === 'shelter-stocked') parts.push('Shelter stocked.');
    if (event.kind === 'crew') parts.push(event.to === 'sheltered' ? 'Crew in shelter.' : 'Crew back at work.');
    if (event.kind === 'ended') parts.push(event.outcome === 'paused' && event.pauseReason ? `Mission paused. ${pauseCopy[event.pauseReason]}` : endingCopy[event.outcome === 'success' ? 'success' : 'partial'].heading);
  }
  if (state.outcome === 'in-progress' && (state.resources.power < 30 || state.resources.oxygen < 30)) parts.push('Warning: a reserve is low.');
  return parts.join(' ');
}

/** Recovery tests set this. It is never set during play. */
function simulatedCrashRequested(): boolean {
  try {
    return window.sessionStorage.getItem('jamt.simulate-error') === '1';
  } catch {
    return false;
  }
}

export function App() {
  const { settings, reducedMotion, update } = useSettings();
  const game = useMission(reducedMotion);
  const [drawer, setDrawer] = useState<DrawerName>(null);
  const [sourceFocus, setSourceFocus] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const announced = useRef(0);

  useEffect(() => {
    const count = game.game.decisionLog.length;
    if (count > announced.current && game.lastEvents.length > 0) setMessage(announce(game.lastEvents, game.game));
    announced.current = count;
  }, [game.game, game.lastEvents]);

  useEffect(() => {
    if (game.appPhase !== 'debrief') return;
    playTone(game.game.outcome === 'success' ? 'good' : 'caution', settings.muted);
    // Only when the debrief opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.appPhase]);

  const openSource = useCallback((id: string | null) => {
    setSourceFocus(id);
    setDrawer('sources');
  }, []);
  const tone = useCallback((name: 'select' | 'confirm') => void playTone(name, settings.muted), [settings.muted]);
  const inMission = game.appPhase === 'mission';
  if (simulatedCrashRequested()) throw new Error('Simulated mission failure');

  return (
    <div className="app" data-app-phase={game.appPhase}>
      <a className="skip-link" href={inMission ? '#decision' : '#main'}>
        {inMission ? 'Skip to the current decision' : 'Skip to the mission'}
      </a>
      <header className="app-header">
        <p className="app-title">{GAME_TITLE}</p>
        {inMission ? (
          <p className="app-objective">
            <span className="objective-label">Goal</span> {OBJECTIVE}
          </p>
        ) : null}
        {inMission ? (
          <div className="turn-pips" role="img" aria-label={`Turn ${game.game.turnIndex + 1} of ${mission.turns.length}`}>
            {mission.turns.map((turn, index) => (
              <span key={turn.id} className="turn-pip" data-state={index < game.game.turnIndex ? 'done' : index === game.game.turnIndex ? 'current' : 'todo'} aria-hidden="true" />
            ))}
          </div>
        ) : null}
        <nav className="app-tools" aria-label="Tools">
          <button type="button" className="button button-quiet" aria-label="Sources" onClick={() => openSource(null)} data-testid="open-sources">
            <Icon name="sources" /> <span>Sources</span>
          </button>
          <button type="button" className="button button-quiet" aria-label="Settings" onClick={() => setDrawer('settings')} data-testid="open-settings">
            <Icon name="gear" /> <span>Settings</span>
          </button>
          <button
            type="button"
            className="button button-quiet"
            aria-label={`Sound: ${settings.muted ? 'off' : 'on'}`}
            aria-pressed={!settings.muted}
            onClick={() => {
              const muted = !settings.muted;
              update({ muted });
              playTone('select', muted);
            }}
            data-testid="sound-toggle"
          >
            <Icon name={settings.muted ? 'mute' : 'sound'} /> <span>Sound: {settings.muted ? 'off' : 'on'}</span>
          </button>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {game.saveStatus === 'failed' ? (
          <p className="notice save-banner" role="status" data-testid="save-failed">
            <Icon name="warning" size={18} /> This progress could not be saved. You can keep playing. Reloading will not keep the latest turn.
          </p>
        ) : null}
        {game.appPhase === 'briefing' ? <Briefing mission={mission} canResume={game.canResume} saveStatus={game.saveStatus} onStart={game.startNew} onResume={game.resume} /> : null}
        {game.appPhase === 'mission' ? <Console state={game.game} mission={mission} dispatch={game.dispatch} onOpenSource={openSource} onTone={tone} /> : null}
        {game.appPhase === 'debrief' ? <Debrief state={game.game} mission={mission} onReplay={game.startNew} onSources={() => openSource(null)} onHome={game.toBriefing} /> : null}
      </main>
      <footer className="app-footer">
        <p>{DISCLAIMER}</p>
        <button type="button" className="link-button" onClick={() => setDrawer('about')} data-testid="open-about">
          About, AI help and privacy
        </button>
      </footer>
      <LiveRegion message={message} />
      <SourcesDrawer open={drawer === 'sources'} onClose={() => setDrawer(null)} focusId={sourceFocus} />
      <SettingsDrawer open={drawer === 'settings'} onClose={() => setDrawer(null)} settings={settings} update={update} onReset={game.resetSave} hasSave={game.hasStoredSave} saveStatus={game.saveStatus} />
      <AboutDrawer open={drawer === 'about'} onClose={() => setDrawer(null)} />
    </div>
  );
}
