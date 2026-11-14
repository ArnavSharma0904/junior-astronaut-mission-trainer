import { expect, type Page } from '@playwright/test';

export const SAVE_KEY = 'jamt.save.v1';

export const WIN = ['charge-1', 'drill-2', 'stock-3', 'remote-4', 'reserve-5', 'drill-6'];
export const WIN_WITHOUT_STOCKING = ['charge-1', 'drill-2', 'drill-3', 'shelter-4', 'reserve-5', 'drill-6'];
export const PARTIAL = ['charge-1', 'charge-2', 'grow-3', 'shelter-4', 'rest-5', 'repair-6'];
export const UNSAFE = ['charge-1', 'drill-2', 'drill-3', 'outside-4'];

export async function start(page: Page) {
  await page.goto('/');
  await page.getByTestId('start').click();
  await expect(page.getByRole('heading', { name: 'Morning check' })).toBeVisible();
}

/** Takes one decision with the mouse and waits for the explanation. */
export async function decide(page: Page, actionId: string) {
  await page.getByTestId(`choice-${actionId}`).click();
  await page.getByTestId('confirm').click();
  await expect(page.getByTestId('explanation')).toBeVisible();
}

export async function playThrough(page: Page, ids: string[]) {
  for (const id of ids) {
    await decide(page, id);
    await page.getByTestId('next').click();
  }
}

export const value = async (page: Page, id: 'power' | 'oxygen' | 'samples') => Number(await page.getByTestId(`value-${id}`).first().innerText());

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** The control is inside the current viewport and is the thing under the pointer, without scrolling it into view first. */
export async function expectVisibleUncovered(page: Page, locator: ReturnType<Page['locator']>) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
  const uncovered = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + Math.min(12, rect.width / 2), rect.top + Math.min(12, rect.height / 2)],
      [rect.right - Math.min(12, rect.width / 2), rect.bottom - Math.min(12, rect.height / 2)],
    ];
    return points.every(([x, y]) => {
      if (x === undefined || y === undefined) return false;
      const hit = document.elementFromPoint(x, y);
      return hit !== null && (hit === element || element.contains(hit));
    });
  });
  expect(uncovered).toBe(true);
}
