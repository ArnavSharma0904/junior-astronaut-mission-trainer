import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { readJson, SETTINGS_KEY, writeJson } from './storage';

export const THEMES = ['flight-deck', 'fieldbook', 'night-shift'] as const;
export type ThemeName = (typeof THEMES)[number];

const legacySchema = z.object({
  muted: z.boolean(),
  reducedMotion: z.enum(['system', 'on', 'off']),
  lowEffects: z.boolean(),
});
const themeSchema = z.enum(THEMES);

export interface Settings {
  muted: boolean;
  reducedMotion: 'system' | 'on' | 'off';
  lowEffects: boolean;
  theme: ThemeName;
}

/** Sound is off until the player turns it on. Motion follows the device setting until the player chooses. */
export const DEFAULT_SETTINGS: Settings = { muted: true, reducedMotion: 'system', lowEffects: false, theme: 'flight-deck' };

/**
 * Old saves have sound, motion and low effects, and no theme. An unknown theme name keeps those three
 * and uses Flight Deck. A broken object falls back to the defaults instead of crashing.
 */
export function interpretSettings(value: unknown): Settings {
  const legacy = legacySchema.safeParse(value);
  if (!legacy.success) return DEFAULT_SETTINGS;
  const theme = themeSchema.safeParse(value && typeof value === 'object' ? (value as { theme?: unknown }).theme : undefined);
  return { ...legacy.data, theme: theme.success ? theme.data : 'flight-deck' };
}

function loadSettings(): Settings {
  const stored = readJson(SETTINGS_KEY);
  if (!stored.found) return DEFAULT_SETTINGS;
  return interpretSettings(stored.value);
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
  const current = useRef(settings);
  const systemReduced = useSyncExternalStore(subscribe, systemPrefersReduced);
  const reducedMotion = settings.reducedMotion === 'on' || (settings.reducedMotion === 'system' && systemReduced);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    root.dataset.effects = settings.lowEffects ? 'low' : 'full';
    root.dataset.theme = settings.theme;
  }, [reducedMotion, settings.lowEffects, settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...current.current, ...patch };
    const saved = writeJson(SETTINGS_KEY, next);
    current.current = next;
    setSettings(next);
    return saved;
  }, []);

  return { settings, reducedMotion, update };
}
