/** One polite region. It receives one composed sentence per decision, never a stream of animation updates. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-testid="live-region">
      {message}
    </div>
  );
}
