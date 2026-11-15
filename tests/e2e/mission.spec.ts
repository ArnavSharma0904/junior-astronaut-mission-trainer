import { expect, test } from '@playwright/test';
import { mission } from '../../src/content/mission';
import { decide, PARTIAL, playThrough, SAVE_KEY, start, UNSAFE, value, WIN, WIN_WITHOUT_STOCKING } from './helpers';

test.describe('complete mission', () => {
  test('briefing to success, with meters that match the mission data', async ({ page }) => {
    await start(page);
    expect(await value(page, 'power')).toBe(mission.start.power);
    expect(await value(page, 'oxygen')).toBe(mission.start.oxygen);

    await page.getByTestId('choice-charge-1').click();
    // The preview shows where the meter will land before anything is spent.
    await expect(page.getByTestId('preview-oxygen')).toContainText(String(mission.start.oxygen - mission.upkeep.oxygen));
    expect(await value(page, 'oxygen')).toBe(mission.start.oxygen);
    await page.getByTestId('confirm').click();
    await expect(page.getByTestId('explanation')).toBeVisible();
    expect(await value(page, 'oxygen')).toBe(mission.start.oxygen - mission.upkeep.oxygen);
    expect(await value(page, 'power')).toBe(100);
    await page.getByTestId('next').click();

    await playThrough(page, WIN.slice(1));
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
    await expect(page.getByTestId('decision-log').getByRole('listitem')).toHaveCount(6);
    expect(await value(page, 'samples')).toBe(3);
  });

  test('a different strategy also succeeds', async ({ page }) => {
    await start(page);
    await playThrough(page, WIN_WITHOUT_STOCKING);
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
    await expect(page.getByTestId('decision-log')).toContainText('rushed');
  });

  test('an oxygen value of 0 keeps the same meter rows as a two-digit value', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await start(page);
    const offsets = () =>
      page.locator('[data-testid="meter-oxygen"]').evaluate((root) => {
        const top = (selector: string) => {
          const node = root.querySelector(selector);
          return node ? node.getBoundingClientRect().top - root.getBoundingClientRect().top : Number.NaN;
        };
        return { state: top('.meter-state'), value: top('.meter-number'), unit: top('.meter-unit') };
      });
    const twoDigits = await offsets();
    expect(await page.getByTestId('value-oxygen').innerText()).toBe('70');
    await playThrough(page, ['drill-1', 'stock-2', 'drill-3', 'shelter-4', 'rest-5', 'drill-6']);
    expect(await page.getByTestId('value-oxygen').innerText()).toBe('0');
    const zero = await offsets();
    expect(Math.abs(twoDigits.state - zero.state)).toBeLessThanOrEqual(2);
    expect(Math.abs(twoDigits.value - zero.value)).toBeLessThanOrEqual(2);
    expect(Math.abs(twoDigits.unit - zero.unit)).toBeLessThanOrEqual(2);
  });

  test('working outside in the storm pauses the mission and says why', async ({ page }) => {
    await start(page);
    await playThrough(page, UNSAFE);
    await expect(page.getByTestId('outcome')).toHaveText('Mission paused: crew safe');
    await page.setViewportSize({ width: 390, height: 844 });
    const buttonWidths = await page.locator('.debrief-actions .button').evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().width)));
    expect(buttonWidths).toHaveLength(3);
    expect(Math.max(...buttonWidths) - Math.min(...buttonWidths)).toBeLessThanOrEqual(1);
    await expect(page.getByTestId('pause-reason')).toContainText('brought everyone inside');
    await expect(page.getByTestId('decision-log')).toContainText('Keep working outside');
    await expect(page.getByTestId('chip-crew')).toContainText('In shelter');
    await expect(page.locator('.scene')).toHaveAttribute('data-crew', 'sheltered');
    await expect(page.locator('.scene')).toHaveAttribute('aria-label', /brought them inside the shelter/);
    await expect(page.locator('.scene')).toHaveAttribute('data-outcome', 'paused');
  });

  test('a safe but incomplete mission names exactly what was short', async ({ page }) => {
    await start(page);
    await playThrough(page, PARTIAL);
    await expect(page.getByTestId('outcome')).toHaveText('Mission finished safely');
    await expect(page.getByTestId('missing')).toContainText('Not enough ice samples');
  });

  test('the scene and status chips react to decisions', async ({ page }) => {
    await start(page);
    await expect(page.getByTestId('scene-caption')).toContainText('The streaks are a game illustration. You cannot see these particles.');
    await page.setViewportSize({ width: 390, height: 844 });
    const phoneLandmarks = await page.evaluate(() => {
      const frame = document.querySelector('.console .scene-frame')?.getBoundingClientRect();
      const seen = (selector: string) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        if (!frame || !rect) return false;
        const width = Math.min(rect.right, frame.right) - Math.max(rect.left, frame.left);
        const height = Math.min(rect.bottom, frame.bottom) - Math.max(rect.top, frame.top);
        return width > 6 && height > 6;
      };
      return { earth: seen('.scene-earth'), rim: seen('.crater-rim'), drill: seen('.module-drill'), sky: seen('.scene-stars') };
    });
    expect(phoneLandmarks).toEqual({ earth: true, rim: true, drill: true, sky: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const captionClearsRover = await page.evaluate(() => {
      const caption = document.querySelector('[data-testid="scene-caption"]')?.getBoundingClientRect();
      const rover = document.querySelector('.scene-rover')?.getBoundingClientRect();
      return Boolean(caption && rover && caption.bottom < rover.top);
    });
    expect(captionClearsRover).toBe(true);
    const scene = page.locator('.scene');
    await expect(scene).toHaveAttribute('data-stocked', 'false');
    await playThrough(page, ['charge-1']);
    await decide(page, 'stock-2');
    await expect(scene).toHaveAttribute('data-stocked', 'true');
    await expect(scene).toHaveAttribute('data-pulse', 'shelter');
    await expect(page.getByTestId('chip-shelter')).toContainText('Stocked');
    await page.getByTestId('next').click();
    await playThrough(page, ['drill-3']);
    await expect(scene).toHaveAttribute('data-weather', 'storm');
    await expect(page.getByTestId('chip-weather')).toContainText('Storm');
    await decide(page, 'shelter-4');
    await expect(scene).toHaveAttribute('data-crew', 'sheltered');
    await expect(page.getByTestId('chip-crew')).toContainText('In shelter');
    await expect(scene).toHaveAttribute('aria-label', /crew is inside the soil-covered shelter/);
  });

  test('a rapid double click on Confirm spends resources once', async ({ page }) => {
    await start(page);
    await page.getByTestId('choice-drill-1').click();
    await page.getByTestId('confirm').dblclick();
    await expect(page.getByTestId('explanation')).toBeVisible();
    expect(await value(page, 'power')).toBe(mission.start.power - 16 - mission.upkeep.power);
    expect(await value(page, 'samples')).toBe(1);
    const log = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)!).state.decisionLog.length, SAVE_KEY);
    expect(log).toBe(1);
  });

  test('an unavailable choice explains why and cannot be confirmed', async ({ page }) => {
    await start(page);
    await playThrough(page, ['charge-1', 'stock-2']);
    const blocked = page.getByTestId('choice-stock-3');
    await expect(blocked).toContainText('The shelter is already stocked');
    await blocked.click({ force: true }); // Playwright will not click aria-disabled controls unless forced; a person can.
    await expect(page.getByTestId('confirm')).toBeDisabled();
    await expect(page.getByTestId('confirm')).toHaveText('Pick a choice first');
  });

  test('play again starts a fresh mission', async ({ page }) => {
    await start(page);
    await playThrough(page, UNSAFE);
    await page.getByTestId('replay').click();
    await expect(page.getByRole('heading', { name: 'Morning check' })).toBeVisible();
    expect(await value(page, 'power')).toBe(mission.start.power);
    expect(await value(page, 'samples')).toBe(0);
  });

  test('every turn shows the real records behind it, and the storm turn shows the derived gap', async ({ page }) => {
    await start(page);
    await expect(page.getByRole('button', { name: /5 X-class flares/ })).toBeVisible();
    await expect(page.getByText('Archived NASA record from May 2024. Not live.')).toBeVisible();
    await playThrough(page, ['charge-1', 'drill-2']);
    await expect(page.getByRole('button', { name: /Forecast model/ })).toHaveCount(2);
    await playThrough(page, ['drill-3']);
    await decide(page, 'shelter-4');
    const explanation = page.getByTestId('explanation');
    await expect(explanation).toContainText('47 minutes after the X5.8 flare peak');
    await expect(explanation).toContainText('not a measured arrival at the Moon');
    await expect(explanation).toContainText('Observed');
    await expect(explanation).toContainText('Science idea');
    await expect(explanation).toContainText('Game rule');
  });
});
