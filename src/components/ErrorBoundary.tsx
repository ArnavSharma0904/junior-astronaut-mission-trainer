import { Component, type ReactNode } from 'react';

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
        <p>The mission could not be shown. Reloading the page usually fixes this.</p>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
