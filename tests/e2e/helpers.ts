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
