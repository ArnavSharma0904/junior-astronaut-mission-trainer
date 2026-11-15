import { expect, test, type Page } from '@playwright/test';
import { expectEntirelyReachable, expectNoHorizontalOverflow, expectVisibleUncovered, playThrough } from './helpers';

const THEMES = ['flight-deck', 'fieldbook', 'night-shift'] as const;
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 800, height: 500 },
  { width: 1280, height: 640 },
];

async function surfaceContrast(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const target = document.querySelector(sel);
    if (!target) return 0;
    const parse = (value: string) => {
      const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([0-9.]+))?/.exec(value);
      if (!match) return null;
      return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
    };
    const over = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
    });
    const chain: Element[] = [];
    let node: Element | null = target;
    while (node) {
      chain.push(node);
      node = node.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255 };
    for (const item of chain.reverse()) {
      const color = parse(getComputedStyle(item).backgroundColor);
      if (color && color.a > 0) bg = over(color, bg);
    }
    const fg = parse(getComputedStyle(target).color);
    if (!fg) return 0;
    const lum = (color: { r: number; g: number; b: number }) => {
      const channel = (part: number) => {
        const raw = part / 255;
        return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    };
    const lighter = Math.max(lum(fg), lum(bg));
    const darker = Math.min(lum(fg), lum(bg));
    return (lighter + 0.05) / (darker + 0.05);
  }, selector);
}

async function contrast(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.body);
    const parse = (value: string) => {
      const match = /rgba?\((\d+), (\d+), (\d+)/.exec(value);
      if (!match) return null;
      const channel = (part: string) => {
        const raw = Number(part) / 255;
        return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
      };
      const [red, green, blue] = [channel(match[1]!), channel(match[2]!), channel(match[3]!)];
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const fg = parse(style.color);
    const bg = parse(style.backgroundColor);
    if (fg == null || bg == null) return 0;
    const lighter = Math.max(fg, bg);
    const darker = Math.min(fg, bg);
    return (lighter + 0.05) / (darker + 0.05);
  });
}

test.describe('themes and keyboard route', () => {
  test('legacy, unknown and denied settings stay honest', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('jamt.settings.v1', JSON.stringify({ muted: false, reducedMotion: 'on', lowEffects: true }));
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'flight-deck');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('html')).toHaveAttribute('data-effects', 'low');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-label', 'Sound: on');

    await page.evaluate(() => localStorage.setItem('jamt.settings.v1', JSON.stringify({ muted: true, reducedMotion: 'system', lowEffects: false, theme: 'plasma' })));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'flight-deck');
  });

  test('a denied settings write does not claim the theme was saved', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      };
    });
    await page.goto('/');
    await page.getByTestId('open-settings').click();
    await page.getByTestId('theme-fieldbook').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'fieldbook');
    await expect(page.getByTestId('settings-save-failed')).toBeVisible();
    await expect(page.getByTestId('settings-save-failed')).not.toContainText('Saved');
  });

  test('a normal settings write persists and does not warn', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('open-settings').click();
    await page.getByTestId('theme-fieldbook').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'fieldbook');
    await expect(page.getByTestId('settings-save-failed')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'fieldbook');
    await expect(page.getByTestId('settings-save-failed')).toHaveCount(0);
  });

  test('a denied settings read falls back to Flight deck', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new DOMException('SecurityError', 'SecurityError');
      };
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'flight-deck');
    await expect(page.locator('html')).toHaveAttribute('data-effects', 'full');
  });

  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${theme} stays in the viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.getByTestId('open-settings').click();
        await page.getByTestId(`theme-${theme}`).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.keyboard.press('Escape');
        await expectNoHorizontalOverflow(page);
        const start = page.getByTestId('start');
        if (viewport.height >= 768) {
          await expectVisibleUncovered(page, start);
        } else {
          await start.scrollIntoViewIfNeeded();
          const box = await start.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.y).toBeGreaterThanOrEqual(-1);
          expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
        }
        expect(await contrast(page)).toBeGreaterThanOrEqual(4.5);
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      });
    }
  }

  test('keyboard route uses Tab, Space, Enter and Escape', async ({ page }) => {
    await page.goto('/');
    const start = page.getByTestId('start');
    for (let presses = 0; presses < 12 && !(await start.evaluate((element) => element === document.activeElement)); presses += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(start).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Morning check' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('choice-charge-1')).toHaveAttribute('data-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('choice-drill-1')).toHaveAttribute('data-selected', 'true');
    const confirm = page.getByTestId('confirm');
    for (let presses = 0; presses < 8 && !(await confirm.evaluate((element) => element === document.activeElement)); presses += 1) {
      await page.keyboard.press('Tab');
    }
    await expectVisibleUncovered(page, confirm);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('explanation')).toBeVisible();
    const sources = page.getByTestId('open-sources');
    for (let presses = 0; presses < 20 && !(await sources.evaluate((element) => element === document.activeElement)); presses += 1) {
      await page.keyboard.press('Shift+Tab');
    }
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('the phone briefing shows the outpost above the card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const layout = await page.evaluate(() => {
      const card = document.querySelector('.briefing-card')?.getBoundingClientRect();
      const frame = document.querySelector('.briefing .scene-frame')?.getBoundingClientRect();
      const hab = document.querySelector('.module-hab')?.getBoundingClientRect();
      return {
        frameTop: frame?.top ?? 0,
        frameBottom: frame?.bottom ?? 0,
        cardTop: card?.top ?? 0,
        habWidth: hab?.width ?? 0,
        covered: Boolean(card && frame && card.top < frame.top + frame.height / 2 && card.bottom > frame.top),
      };
    });
    expect(layout.frameBottom).toBeLessThanOrEqual(layout.cardTop + 2);
    expect(layout.habWidth).toBeGreaterThan(80);
    expect(layout.covered).toBe(false);
  });

  for (const theme of THEMES) {
    test(`${theme} consequence, evidence, critical and ending stay readable`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');
      await page.getByTestId('open-settings').click();
      await page.getByTestId(`theme-${theme}`).click();
      await expect(page.getByTestId('settings-save-failed')).toHaveCount(0);
      expect(await surfaceContrast(page, '#settings-drawer button:disabled')).toBeGreaterThanOrEqual(4.5);
      await page.getByRole('switch', { name: 'Low effects' }).click();
      await page.getByRole('radio', { name: 'Reduce motion' }).click();
      await page.keyboard.press('Escape');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-effects', 'low');
      await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
      await page.getByTestId('start').click();
      await page.getByTestId('choice-drill-1').click();
      expect(await surfaceContrast(page, '.choice[data-selected="true"] .choice-title')).toBeGreaterThanOrEqual(4.5);
      const choice = await page.getByTestId('choice-drill-1').boundingBox();
      expect(choice!.height).toBeGreaterThanOrEqual(44);
      await expectVisibleUncovered(page, page.getByTestId('confirm'));
      await page.getByTestId('confirm').click();
      await expect(page.getByTestId('explanation')).toBeVisible();
      expect(await surfaceContrast(page, '.evidence-row-text')).toBeGreaterThanOrEqual(4.5);
      expect(await surfaceContrast(page, '.evidence-row-tag')).toBeGreaterThanOrEqual(4.5);
      expect(await surfaceContrast(page, '.evidence-row .link-button')).toBeGreaterThanOrEqual(4.5);
      const source = await page.locator('.evidence-row .link-button').first().boundingBox();
      expect(source!.height).toBeGreaterThanOrEqual(44);
      await page.getByTestId('next').click();
      await playThrough(page, ['stock-2', 'drill-3', 'shelter-4']);
      await expect(page.getByTestId('critical')).toBeVisible();
      expect(await surfaceContrast(page, '.critical-banner')).toBeGreaterThanOrEqual(4.5);
      await page.getByTestId('choice-rest-5').click();
      await page.getByTestId('confirm').click();
      await page.getByTestId('next').click();
      await page.getByTestId('choice-drill-6').click();
      await page.getByTestId('confirm').click();
      await page.getByTestId('next').click();
      await expect(page.getByRole('heading', { name: 'Mission paused' })).toBeVisible();
      expect(await surfaceContrast(page, '.debrief-panel')).toBeGreaterThanOrEqual(4.5);
      await page.getByTestId('open-sources').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await surfaceContrast(page, '.drawer')).toBeGreaterThanOrEqual(4.5);
      await page.keyboard.press('Escape');
    });

    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      test(`${theme} at ${viewport.width} and 200% reaches both long explanations with denied storage`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize(viewport);
        await page.addInitScript((name) => {
          localStorage.setItem('jamt.settings.v1', JSON.stringify({ muted: true, reducedMotion: 'system', lowEffects: false, theme: name }));
          Storage.prototype.setItem = () => {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
          };
        }, theme);
        await page.goto('/');
        await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.getByTestId('start').click();
        await expect(page.getByTestId('save-failed')).toBeVisible();
        await page.getByTestId('choice-grow-1').click();
        await expectVisibleUncovered(page, page.getByTestId('confirm'));
        await page.getByTestId('confirm').click();
        await expect(page.getByTestId('explanation')).toBeVisible();
        await expect(page.getByTestId('explanation')).toContainText('Real plants would not fill a base this fast.');
        await expectVisibleUncovered(page, page.getByTestId('next'));
        const rows = page.locator('.evidence-row');
        const count = await rows.count();
        expect(count).toBeGreaterThan(1);
        for (let index = 0; index < count; index += 1) {
          const row = rows.nth(index);
          await expectEntirelyReachable(page, row.locator('.evidence-row-text'));
          const source = row.getByRole('button', { name: /^Source/ });
          if ((await source.count()) > 0) await expectEntirelyReachable(page, source);
        }
        await expectNoHorizontalOverflow(page);
        await page.getByTestId('next').click();
        await playThrough(page, ['drill-2', 'drill-3']);
        await page.getByTestId('choice-outside-4').click();
        await expectVisibleUncovered(page, page.getByTestId('confirm'));
        await page.getByTestId('confirm').click();
        await expect(page.getByTestId('explanation')).toContainText('stayed outside');
        await expectVisibleUncovered(page, page.getByTestId('next'));
        const outsideRows = page.locator('.evidence-row');
        const outsideCount = await outsideRows.count();
        expect(outsideCount).toBeGreaterThan(1);
        for (let index = 0; index < outsideCount; index += 1) {
          await expectEntirelyReachable(page, outsideRows.nth(index).locator('.evidence-row-text'));
        }
        await expectNoHorizontalOverflow(page);
      });
    }
  }

  test('forced colors keep the primary action labeled', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await expect(page.getByTestId('start')).toBeVisible();
    await expect(page.getByTestId('start')).toContainText('Start mission');
    await page.getByTestId('start').click();
    await expect(page.locator('.meter-label').first()).toContainText('Power');
    await expect(page.getByTestId('choice-drill-1')).toContainText('Run the ice drill');
    await page.getByTestId('choice-drill-1').click();
    await expect(page.getByTestId('confirm')).toContainText('Confirm');
    await expect(page.getByTestId('confirm')).toBeVisible();
  });

  for (const theme of THEMES) {
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 800, height: 600 },
    ]) {
      test(`${theme} resource rows share baselines at ${viewport.width}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.addInitScript((name) => {
          localStorage.setItem('jamt.settings.v1', JSON.stringify({ muted: true, reducedMotion: 'on', lowEffects: false, theme: name }));
        }, theme);
        await page.goto('/');
        await page.getByTestId('start').click();
        const rows = await page.evaluate(() => {
          const read = (id: string) => {
            const root = document.querySelector(`[data-testid="${id}"]`);
            const top = (selector: string) => root?.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN;
            return { label: top('.meter-label'), state: top('.meter-state'), value: top('.meter-number'), unit: top('.meter-unit') };
          };
          return { power: read('meter-power'), oxygen: read('meter-oxygen'), samples: read('meter-samples') };
        });
        for (const key of ['label', 'state', 'value', 'unit'] as const) {
          expect(Math.abs(rows.power[key] - rows.oxygen[key])).toBeLessThanOrEqual(2);
          expect(Math.abs(rows.power[key] - rows.samples[key])).toBeLessThanOrEqual(2);
        }
      });
    }
  }
});
