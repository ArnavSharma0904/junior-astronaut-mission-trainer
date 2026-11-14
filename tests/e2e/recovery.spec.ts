import { expect, test } from '@playwright/test';
import { mission } from '../../src/content/mission';
import { SNAPSHOT_VERSION } from '../../src/data';
import { createInitialState } from '../../src/game/reducer';
import { toSave } from '../../src/game/validation';
import { decide, playThrough, SAVE_KEY, start, value, WIN } from './helpers';

test.describe('save, resume and recovery', () => {
  test('reload resumes the mission where it was left', async ({ page }) => {
    await start(page);
    await playThrough(page, ['charge-1', 'drill-2']);
    const power = await value(page, 'power');
    await page.reload();
    await page.getByTestId('resume').click();
    await expect(page.getByRole('heading', { name: 'The forecast changes' })).toBeVisible();
    expect(await value(page, 'power')).toBe(power);
    expect(await value(page, 'samples')).toBe(1);
  });

  test('reload in the middle of an explanation resumes after the decision, not before it', async ({ page }) => {
    await start(page);
    await decide(page, 'drill-1');
    await page.reload();
    await page.getByTestId('resume').click();
    await expect(page.getByTestId('explanation')).toBeVisible();
    expect(await value(page, 'samples')).toBe(1);
  });

  for (const [label, stored] of [
    ['not JSON', '{{{ not json'],
    ['an HTML error page', '<html><body>502</body></html>'],
    ['the wrong shape', JSON.stringify({ schemaVersion: 1, snapshotVersion: 'x', state: { power: 9999 } })],
    ['another data snapshot', JSON.stringify({ schemaVersion: 1, snapshotVersion: 'old', state: {} })],
  ] as const) {
    test(`a saved mission that is ${label} is set aside and play still works`, async ({ page }) => {
      await page.addInitScript(([key, raw]) => window.localStorage.setItem(key, raw), [SAVE_KEY, stored] as const);
      await page.goto('/');
      await expect(page.getByTestId('save-unreadable')).toBeVisible();
      await expect(page.getByTestId('resume')).toHaveCount(0);
      await page.getByTestId('start').click();
      expect(await value(page, 'power')).toBe(mission.start.power);
    });
  }

  test('an explained save with no decision is not offered as Continue, including after reload', async ({ page }) => {
    const fresh = createInitialState(mission, SNAPSHOT_VERSION);
    const corrupt = toSave({ ...fresh, phase: 'explained', inspecting: null, decisionLog: [] });
    await page.addInitScript(([key, raw]) => window.localStorage.setItem(key, raw), [SAVE_KEY, JSON.stringify(corrupt)] as const);
    await page.goto('/');
    await expect(page.getByTestId('save-unreadable')).toBeVisible();
    await expect(page.getByTestId('resume')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('save-unreadable')).toBeVisible();
    await expect(page.getByTestId('resume')).toHaveCount(0);
    await page.getByTestId('start').click();
    await expect(page.getByRole('heading', { name: 'Morning check' })).toBeVisible();
    expect(await value(page, 'power')).toBe(mission.start.power);
  });

  test('erasing the save from Settings needs a second step and returns to the briefing', async ({ page }) => {
    await start(page);
    await playThrough(page, ['charge-1']);
    await page.getByTestId('open-settings').click();
    await page.getByRole('button', { name: 'Erase saved mission' }).click();
    await page.getByRole('button', { name: 'Keep it' }).click();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).not.toBeNull();
    await page.getByRole('button', { name: 'Erase saved mission' }).click();
    await page.getByRole('button', { name: 'Yes, erase it' }).click();
    await expect(page.getByText('Saved mission erased.')).toBeVisible();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('start')).toBeVisible();
    await expect(page.getByTestId('resume')).toHaveCount(0);
  });

  test('the whole mission works offline after the page has loaded, with no request to any other origin', async ({ page, context }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:')) foreign.push(url);
    });
    await start(page);
    await context.setOffline(true);
    await playThrough(page, WIN);
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
    await page.getByTestId('open-sources').click();
    await expect(page.getByRole('dialog', { name: 'Sources and science' })).toBeVisible();
    expect(foreign).toEqual([]);
  });

  test('the mission is fully playable when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    await start(page);
    await expect(page.locator('.scene-frame')).toHaveAttribute('data-renderer', '2d');
    await playThrough(page, WIN);
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
  });

  test('storage that throws does not break play', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
    });
    await start(page);
    await playThrough(page, WIN);
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
  });
});
