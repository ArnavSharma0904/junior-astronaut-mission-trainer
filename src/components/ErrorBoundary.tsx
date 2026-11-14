import { Component, type ReactNode } from 'react';
import { SAVE_KEY } from '../state/storage';

function discardSaveAndReload() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Private mode can throw. Reloading still leaves the in-memory page.
  }
  window.location.reload();
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main id="main" className="fatal">
        <h1>Something went wrong</h1>
        <p>The mission could not be shown. A saved mission on this device can cause the same screen again after a reload.</p>
        <button type="button" className="button" onClick={() => window.location.reload()}>
          Try again
        </button>
        <button type="button" className="button button-primary" onClick={discardSaveAndReload} data-testid="discard-save">
          Discard saved mission and start fresh
        </button>
      </main>
    );
  }
}
