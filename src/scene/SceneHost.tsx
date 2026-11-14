import { Scene2D } from './Scene2D';
import type { SceneModel } from './sceneModel';

/**
 * Chooses the renderer. Only the complete 2D scene exists: the optional WebGL tier (M06) is skipped under the
 * current commit plan, so there is no WebGL to lose and no fallback switch to get wrong.
 */
export function SceneHost({ model, dimmed = false }: { model: SceneModel; dimmed?: boolean }) {
  return (
    <div className="scene-frame" data-dimmed={dimmed} data-renderer="2d">
      <Scene2D model={model} />
    </div>
  );
}
