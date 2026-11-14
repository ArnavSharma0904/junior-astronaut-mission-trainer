export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to mission
      </a>
      <header>
        <p>Junior Astronaut Mission Trainer</p>
      </header>
      <main id="main" tabIndex={-1}>
        <h1>Moon base mission</h1>
        <p>The mission is being built. Nothing is playable yet.</p>
      </main>
      <footer>
        <p>Independent student project. Not endorsed by NASA.</p>
      </footer>
    </>
  );
}
