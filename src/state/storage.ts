/** The only module that touches localStorage. Every call is guarded: private mode or a full disk must not break play. */
export const SAVE_KEY = 'jamt.save.v1';
export const SETTINGS_KEY = 'jamt.settings.v1';

export function readJson(key: string): { found: false } | { found: true; value: unknown } {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { found: false };
    try {
      return { found: true, value: JSON.parse(raw) };
    } catch {
      return { found: true, value: undefined };
    }
  } catch {
    return { found: false };
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Saving is a convenience. The mission keeps working without it.
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
