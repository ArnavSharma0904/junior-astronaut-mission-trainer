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

/**
 * Every line of a claim, and the whole source control, can be scrolled fully above the dock and hit at its start and end.
 * A short uncovered slice of a parent list is not enough.
 */
export async function expectEntirelyReachable(page: Page, locator: ReturnType<Page['locator']>) {
  expect(page.viewportSize()).not.toBeNull();
  const reached = await locator.evaluate((element) => {
    const fail = (reason: string) => ({ ok: false as const, reason });
    const dockTop = () => {
      const dock = document.querySelector('.decision-dock');
      return dock ? dock.getBoundingClientRect().top : window.innerHeight;
    };
    const textRects = () => {
      const range = document.createRange();
      const found: DOMRect[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? '';
        const hidden = node.parentElement?.closest('.visually-hidden');
        if (!hidden && text.trim().length > 0) {
          range.setStart(node, 0);
          range.setEnd(node, text.length);
          found.push(...Array.from(range.getClientRects()));
        }
        node = walker.nextNode();
      }
      return found.filter((rect) => rect.width >= 8 && rect.height >= 8);
    };
    const place = (rect: DOMRect) => {
      const limit = dockTop();
      const overflow = rect.bottom - (limit - 2);
      if (overflow > 0) window.scrollBy(0, overflow);
      const follow = rect.top < 2 ? rect.top - 2 : 0;
      if (follow !== 0) window.scrollBy(0, follow);
    };
    const hit = (rect: DOMRect) => {
      const limit = dockTop();
      const inside = rect.top >= -1 && rect.left >= -1 && rect.bottom <= limit + 1 && rect.right <= window.innerWidth + 1;
      const inset = Math.min(16, Math.max(4, rect.width / 4));
      const points = [
        [rect.left + inset, rect.top + rect.height / 2],
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
        [rect.right - inset, rect.top + rect.height / 2],
      ];
      const hits = points.map(([x, y]) => {
        const node = document.elementFromPoint(x ?? 0, y ?? 0);
        return node !== null && (node === element || element.contains(node));
      });
      return inside && hits.every(Boolean);
    };
    const lines = textRects();
    if (lines.length === 0) return fail('no text rects');
    for (let index = 0; index < lines.length; index += 1) {
      const before = textRects()[index];
      if (!before) return fail(`missing line ${index}`);
      place(before);
      const after = textRects()[index];
      if (!after) return fail(`line ${index} vanished`);
      if (!hit(after)) {
        return fail(`line ${index} top=${after.top.toFixed(0)} bottom=${after.bottom.toFixed(0)} left=${after.left.toFixed(0)} right=${after.right.toFixed(0)} limit=${dockTop().toFixed(0)} text=${element.textContent?.slice(0, 80)}`);
      }
    }
    const box = element.getBoundingClientRect();
    if (element.getClientRects().length <= 1 && box.height <= dockTop() - 8 && box.height >= 8) {
      place(box);
      const again = element.getBoundingClientRect();
      if (!hit(again)) return fail(`box top=${again.top.toFixed(0)} bottom=${again.bottom.toFixed(0)} right=${again.right.toFixed(0)} limit=${dockTop().toFixed(0)} text=${element.textContent?.slice(0, 80)}`);
    }
    return { ok: true as const, reason: '' };
  });
  expect(reached.ok, reached.reason).toBe(true);
}

/** Scroll the learning text into view and confirm the fixed action does not cover it. */
export async function expectScrolledContentVisible(page: Page, locator: ReturnType<Page['locator']>) {
  expect(page.viewportSize()).not.toBeNull();
  await locator.scrollIntoViewIfNeeded();
  const visible = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const dock = document.querySelector('.decision-dock');
    const limit = dock ? dock.getBoundingClientRect().top : window.innerHeight;
    const top = Math.max(rect.top, 0);
    const bottom = Math.min(rect.bottom, limit - 1);
    if (rect.width < 8 || bottom - top < 8) return false;
    const y = top + Math.min(16, (bottom - top) / 2);
    const x = rect.left + Math.min(28, rect.width / 2);
    const hit = document.elementFromPoint(x, y);
    return hit !== null && (hit === element || element.contains(hit));
  });
  expect(visible).toBe(true);
}
