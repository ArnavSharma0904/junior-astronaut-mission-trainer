import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, expectVisibleUncovered } from './helpers';

const THEMES = ['flight-deck', 'fieldbook', 'night-shift'] as const;
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 800, height: 500 },
  { width: 1280, height: 640 },
];

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

  test('forced colors keep the primary action labeled', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await expect(page.getByTestId('start')).toBeVisible();
    await expect(page.getByTestId('start')).toContainText('Start mission');
  });
});
