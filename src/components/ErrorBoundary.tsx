import { Component, type ReactNode } from 'react';
import { remove, SAVE_KEY } from '../state/storage';

interface State {
  failed: boolean;
  discardFailed: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, discardFailed: false };

  static getDerivedStateFromError(): State {
    return { failed: true, discardFailed: false };
  }

  private discard = () => {
    if (!remove(SAVE_KEY)) {
      this.setState({ discardFailed: true });
      return;
    }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main id="main" className="fatal">
        <h1>Something went wrong</h1>
        <p>The mission could not be shown. A saved mission on this device can cause the same screen again after a reload.</p>
        {this.state.discardFailed ? (
          <p role="status" data-testid="discard-failed">
            The saved mission is still on this device. Discard did not work, so this page was not reloaded. You can try again.
          </p>
        ) : null}
        <button type="button" className="button" onClick={() => window.location.reload()}>
          Try again
        </button>
        <button type="button" className="button button-primary" onClick={this.discard} data-testid="discard-save">
          Discard saved mission and start fresh
        </button>
      </main>
    );
  }
}
