import { useSyncExternalStore } from 'react';
import { Scene2D } from './Scene2D';
import type { SceneModel } from './sceneModel';

const PHONE_QUERY = '(max-width: 720px)';

function subscribePhone(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Phone framing is a tighter view of the same outpost, not a second illustration. */
function usePhoneFrame() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

function useLowEffects() {
  return useSyncExternalStore(
    (notify) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-effects'] });
      return () => observer.disconnect();
    },
    () => document.documentElement.dataset.effects === 'low',
    () => false,
  );
}

/**
 * Chooses the renderer. Only the complete 2D scene exists: the optional WebGL tier (M06) is skipped under the
 * current commit plan, so there is no WebGL to lose and no fallback switch to get wrong.
 */
export function SceneHost({ model, dimmed = false, framing = 'console' }: { model: SceneModel; dimmed?: boolean; framing?: 'console' | 'briefing' }) {
  const phone = usePhoneFrame();
  const lowEffects = useLowEffects();
  const frame = framing === 'briefing' ? 'briefing' : phone ? 'base' : 'wide';
  const showStreaks = !lowEffects && model.weather !== 'quiet';
  return (
    <div className="scene-frame" data-dimmed={dimmed} data-renderer="2d" data-frame={frame} data-streaks={showStreaks ? 'on' : 'off'}>
      <Scene2D model={model} frame={frame} showStreaks={showStreaks} />
      {showStreaks ? (
        <p className="scene-caption" data-testid="scene-caption">
          The streaks are a game illustration. You cannot see these particles. Cyan lines are power cables.
        </p>
      ) : (
        <p className="scene-caption scene-caption-cables" data-testid="scene-cables">
          Cyan lines are power cables between the modules.
        </p>
      )}
    </div>
  );
}
