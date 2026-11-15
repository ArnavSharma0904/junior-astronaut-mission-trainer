import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, interpretSettings } from '../../src/state/settings';

describe('settings migration', () => {
  it('keeps sound, motion and low effects when an older save has no theme', () => {
    expect(interpretSettings({ muted: false, reducedMotion: 'on', lowEffects: true })).toEqual({
      muted: false,
      reducedMotion: 'on',
      lowEffects: true,
      theme: 'flight-deck',
    });
  });

  it('keeps those preferences when the theme name is unknown', () => {
    expect(interpretSettings({ muted: false, reducedMotion: 'off', lowEffects: false, theme: 'plasma' }).theme).toBe('flight-deck');
    expect(interpretSettings({ muted: false, reducedMotion: 'off', lowEffects: false, theme: 'plasma' }).muted).toBe(false);
  });

  it('falls back to defaults for a broken object', () => {
    expect(interpretSettings({ muted: 'yes' })).toEqual(DEFAULT_SETTINGS);
    expect(interpretSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('accepts the three theme names', () => {
    expect(interpretSettings({ muted: true, reducedMotion: 'system', lowEffects: false, theme: 'fieldbook' }).theme).toBe('fieldbook');
    expect(interpretSettings({ muted: true, reducedMotion: 'system', lowEffects: false, theme: 'night-shift' }).theme).toBe('night-shift');
  });
});
