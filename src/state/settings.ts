import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { readJson, SETTINGS_KEY, writeJson } from './storage';

const settingsSchema = z.strictObject({
  muted: z.boolean(),
  reducedMotion: z.enum(['system', 'on', 'off']),
  lowEffects: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

/** Sound is off until the player turns it on. Motion follows the device setting until the player chooses. */
export const DEFAULT_SETTINGS: Settings = { muted: true, reducedMotion: 'system', lowEffects: false };

function loadSettings(): Settings {
  const stored = readJson(SETTINGS_KEY);
  if (!stored.found) return DEFAULT_SETTINGS;
  const parsed = settingsSchema.safeParse(stored.value);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

const QUERY = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const systemPrefersReduced = () => window.matchMedia(QUERY).matches;

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const systemReduced = useSyncExternalStore(subscribe, systemPrefersReduced);
  const reducedMotion = settings.reducedMotion === 'on' || (settings.reducedMotion === 'system' && systemReduced);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    root.dataset.effects = settings.lowEffects ? 'low' : 'full';
  }, [reducedMotion, settings.lowEffects]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      writeJson(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  return { settings, reducedMotion, update };
}
