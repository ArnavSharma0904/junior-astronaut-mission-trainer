import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mission } from '../content/mission';
import { SNAPSHOT_VERSION } from '../data';
import { createInitialState, resolve } from '../game/reducer';
import type { ConsequenceEvent, GameEvent, GameState, RejectionReason } from '../game/types';
import { loadSavedState, toSave } from '../game/validation';
import { readJson, remove, SAVE_KEY, writeJson } from './storage';

export type AppPhase = 'briefing' | 'mission' | 'debrief';
export type SaveStatus = 'none' | 'resumable' | 'unreadable';

interface Boot {
  saved: GameState | null;
  saveStatus: SaveStatus;
}

function boot(): Boot {
  const stored = readJson(SAVE_KEY);
  if (!stored.found) return { saved: null, saveStatus: 'none' };
  const loaded = loadSavedState(stored.value, mission, SNAPSHOT_VERSION);
  if (!loaded.ok) return { saved: null, saveStatus: 'unreadable' };
  return { saved: loaded.state, saveStatus: 'resumable' };
}

/** How long the scene shows a consequence before the explanation appears. Presentation only. */
export const RESOLUTION_MS = 900;

export function useMission(reducedMotion: boolean) {
  const initial = useMemo(boot, []);
  const [saved, setSaved] = useState<GameState | null>(initial.saved);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initial.saveStatus);
  const [appPhase, setAppPhase] = useState<AppPhase>('briefing');
  const [game, setGame] = useState<GameState>(() => createInitialState(mission, SNAPSHOT_VERSION));
  const [lastEvents, setLastEvents] = useState<ConsequenceEvent[]>([]);
  const [rejection, setRejection] = useState<RejectionReason | null>(null);
  // The latest state is kept in a ref so two clicks in the same frame are resolved one after the other
  // against real state. The reducer then rejects the second commit: resources can never be spent twice.
  const latest = useRef(game);

  const apply = useCallback((next: GameState, persist: boolean) => {
    latest.current = next;
    setGame(next);
    if (persist) {
      writeJson(SAVE_KEY, toSave(next));
      setSaved(next);
      setSaveStatus('resumable');
    }
  }, []);

  const dispatch = useCallback(
    (event: GameEvent) => {
      const result = resolve(latest.current, event, mission);
      if (result.rejected) {
        setRejection(result.rejected);
        return result;
      }
      setRejection(null);
      if (event.type === 'COMMIT') setLastEvents(result.events);
      apply(result.state, event.type !== 'INSPECT');
      if (result.state.phase === 'ended') setAppPhase('debrief');
      return result;
    },
    [apply],
  );

  // After a commit the scene plays the consequence, then the explanation appears. With reduced motion it is immediate.
  useEffect(() => {
    if (game.phase !== 'resolving') return;
    const timer = window.setTimeout(() => dispatch({ type: 'RESOLUTION_SHOWN' }), reducedMotion ? 0 : RESOLUTION_MS);
    return () => window.clearTimeout(timer);
  }, [game.phase, reducedMotion, dispatch]);

  const startNew = useCallback(() => {
    setLastEvents([]);
    setRejection(null);
    apply(createInitialState(mission, SNAPSHOT_VERSION), true);
    setAppPhase('mission');
  }, [apply]);

  const resume = useCallback(() => {
    if (!saved) return;
    setLastEvents([]);
    setRejection(null);
    apply(saved, false);
    setAppPhase(saved.phase === 'ended' ? 'debrief' : 'mission');
  }, [apply, saved]);

  const resetSave = useCallback(() => {
    remove(SAVE_KEY);
    setSaved(null);
    setSaveStatus('none');
    setLastEvents([]);
    setRejection(null);
    latest.current = createInitialState(mission, SNAPSHOT_VERSION);
    setGame(latest.current);
    setAppPhase('briefing');
  }, []);

  const toBriefing = useCallback(() => setAppPhase('briefing'), []);

  return { appPhase, game, lastEvents, rejection, saveStatus, canResume: saved !== null && saved.phase !== 'ended', dispatch, startNew, resume, resetSave, toBriefing };
}
