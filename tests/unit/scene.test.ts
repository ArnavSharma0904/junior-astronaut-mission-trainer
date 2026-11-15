import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Scene2D } from '../../src/scene/Scene2D';
import { BRIEFING_SCENE, type SceneModel } from '../../src/scene/sceneModel';

function markup(model: SceneModel) {
  return renderToStaticMarkup(createElement(Scene2D, { model }));
}

describe('scene state stays on the drawing', () => {
  it('draws a layered outpost and keeps Earth, the habitat and the greenhouse distinct', () => {
    const html = markup(BRIEFING_SCENE);
    expect(html).toContain('scene-background');
    expect(html).toContain('scene-midground');
    expect(html).toContain('scene-foreground');
    expect(html.indexOf('scene-background')).toBeLessThan(html.indexOf('module-hab'));
    expect(html.indexOf('module-hab')).toBeLessThan(html.indexOf('scene-foreground'));
    expect(html).toContain('scene-earth-ocean');
    expect(html).toContain('scene-earth-land');
    expect(html).toContain('scene-earth-cloud');
    expect(html).toContain('pressure-shell');
    expect(html).toContain('airlock-hatch');
    expect(html).toContain('greenhouse-rib');
    expect(html).toContain('greenhouse-bed');
    expect(html).toContain('solar-cell');
    expect(html).not.toContain('visible particles');
  });

  it('changes crew, samples, shelter stock and weather without changing the module set', () => {
    const working = markup(BRIEFING_SCENE);
    const sheltered = markup({ ...BRIEFING_SCENE, crew: 'sheltered', shelterStocked: true, samples: 2, weather: 'storm', oxygen: 'low' });
    expect(working).toContain('data-crew="working"');
    expect(working).toContain('crew-working');
    expect(working).toContain('crew-sheltered');
    expect(sheltered).toContain('data-crew="sheltered"');
    expect(sheltered).toContain('data-stocked="true"');
    expect(sheltered).toContain('data-weather="storm"');
    expect(sheltered).toContain('data-oxygen="low"');
    expect(sheltered.match(/sample-filled/g)?.length).toBe(2);
    expect(sheltered).toContain('plant-0');
    expect(sheltered).toContain('plant-5');
  });
});
