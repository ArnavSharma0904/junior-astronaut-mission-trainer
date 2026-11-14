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

/** Returns false when the browser refuses the write. Callers must not claim the value was stored. */
export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
