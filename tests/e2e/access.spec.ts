import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { decide, expectNoHorizontalOverflow, expectVisibleUncovered, playThrough, start, UNSAFE, WIN } from './helpers';

async function expectNoAxeViolations(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().flatMap((animation) => {
        const iterations = animation.effect?.getTiming().iterations;
        return iterations === Infinity ? [] : [animation.finished.catch(() => undefined)];
      }),
    ),
  );
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([]);
}

test.describe('accessibility and settings', () => {
  test('keyboard only: a whole mission from the briefing to the debrief', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to the mission' })).toBeFocused();
    await page.getByTestId('start').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Morning check' })).toBeFocused();

    for (const id of WIN) {
      // Tab from the situation heading lands in the radio group; arrows move between choices.
      await page.keyboard.press('Tab');
      const target = page.locator(`#action-${id}`);
      for (let presses = 0; presses < 4 && !(await target.isChecked()); presses += 1) {
        const focusedIsTarget = await target.evaluate((element) => element === document.activeElement);
        await page.keyboard.press(focusedIsTarget ? 'Space' : 'ArrowDown');
      }
      await expect(target).toBeChecked();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'What happened' })).toBeFocused();
      await page.getByTestId('next').focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId('outcome')).toBeFocused();
    await expect(page.getByTestId('outcome')).toHaveText('Mission complete');
  });

  test('each decision is announced once as a single sentence', async ({ page }) => {
    await start(page);
    await decide(page, 'drill-1');
    await expect(page.getByTestId('live-region')).toHaveText('Power down to 72. Oxygen down to 60. Ice samples: 1 of 3.');
  });

  test('the sources drawer traps focus, closes on Escape and returns focus to its opener', async ({ page }) => {
    await start(page);
    const opener = page.getByTestId('open-sources');
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Sources and science' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('archived NASA record, not live data');
    for (let presses = 0; presses < 40; presses += 1) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null || document.activeElement === document.body)).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('a timeline record opens the drawer at that exact source', async ({ page }) => {
    await start(page);
    await page.getByRole('button', { name: /5 X-class flares/ }).click();
    const record = page.locator('#source-donki-flr-window-2024-05');
    await expect(record).toBeFocused();
    await expect(record).toContainText('five X-class solar flares');
    await expect(record).toContainText('Does not show');
    await expect(page.locator('#source-donki-enlil-run-a')).toContainText('WSA-ENLIL/30626/1');
  });

  test('sound is off by default and the toggle has a real effect', async ({ page }) => {
    await start(page);
    const toggle = page.getByTestId('sound-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.getByTestId('choice-drill-1').click();
    expect(await page.evaluate(() => document.documentElement.dataset.lastTone)).toBeUndefined();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toContainText('Sound: on');
    await page.getByTestId('choice-grow-1').click();
    expect(await page.evaluate(() => document.documentElement.dataset.lastTone)).toBe('select');
    await page.reload();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  test('reduced motion from the device is respected and nothing is lost', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await start(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.getByTestId('choice-drill-1').click();
    await page.getByTestId('confirm').click();
    await expect(page.getByTestId('explanation')).toBeVisible({ timeout: 400 });
    await expect(page.getByTestId('explanation')).toContainText('Power −16');
    await expect(page.locator('.scene')).toHaveAttribute('data-pulse', 'drill');
    await context.close();
  });

  test('motion and low-effects settings apply at once and persist', async ({ page }) => {
    await start(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    const scanBefore = await page.locator('.scene-frame').evaluate((element) => getComputedStyle(element, '::after').display);
    expect(scanBefore).not.toBe('none');
    await page.getByTestId('open-settings').click();
    await page.getByRole('radio', { name: 'Reduce motion' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.getByRole('switch', { name: 'Low effects' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-effects', 'low');
    const scanAfter = await page.locator('.scene-frame').evaluate((element) => getComputedStyle(element, '::after').display);
    const conduit = await page.locator('.scene .conduit').first().evaluate((element) => getComputedStyle(element).animationName);
    expect(scanAfter).toBe('none');
    expect(conduit).toBe('none');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('open-settings')).toBeFocused();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-effects', 'low');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  });

  test('about explains AI help, real data, made-up parts and privacy', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('open-about').click();
    const dialog = page.getByRole('dialog', { name: 'About this game' });
    await expect(dialog).toContainText('Not endorsed by NASA');
    await expect(dialog).toContainText('AI assistant');
    await expect(dialog).toContainText('No accounts, no tracking');
  });

  test('no automatic accessibility violations on any screen', async ({ page }) => {
    test.setTimeout(180_000); // six full axe scans in one flow
    await page.goto('/');
    await expectNoAxeViolations(page);
    await page.getByTestId('start').click();
    await page.getByTestId('choice-grow-1').click();
    await expectNoAxeViolations(page);
    await page.getByTestId('confirm').click();
    await expect(page.getByTestId('explanation')).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByTestId('open-sources').click();
    await expectNoAxeViolations(page);
    await page.keyboard.press('Escape');
    await page.getByTestId('open-settings').click();
    await expectNoAxeViolations(page);
    await page.keyboard.press('Escape');
    await page.getByTestId('next').click();
    await playThrough(page, UNSAFE.slice(1));
    await expectNoAxeViolations(page);
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    test(`no horizontal overflow or hidden Confirm at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expectNoHorizontalOverflow(page);
      await expect(page.getByTestId('start')).toBeInViewport();
      await page.getByTestId('start').click();
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('.app-objective')).toBeVisible();
      await expect(page.locator('.app-objective')).toContainText('Collect ice samples and keep the crew safe.');
      await expect(page.getByTestId('open-sources')).toHaveAttribute('aria-label', 'Sources');
      await expect(page.getByTestId('open-settings')).toHaveAttribute('aria-label', 'Settings');
      await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-label', 'Sound: off');
      await page.getByTestId('choice-drill-1').click();
      await expectVisibleUncovered(page, page.getByTestId('confirm'));
      await page.getByTestId('confirm').click();
      await expect(page.getByTestId('explanation')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.getByTestId('next').click();
      await playThrough(page, UNSAFE.slice(1));
      await expectNoHorizontalOverflow(page);
      await page.getByTestId('open-sources').click();
      await expectNoHorizontalOverflow(page);
    });
  }
});
