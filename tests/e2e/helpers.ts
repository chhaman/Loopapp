import { expect, type Page } from "@playwright/test";

export const activeItem = (page: Page) => page.locator('[data-testid="feed-item"]', { has: page.locator('iframe[aria-hidden="false"]') });

export async function waitForActiveMiniapp(page: Page, slug: string) {
  const item = page.locator(`[data-testid="feed-item"][data-slug="${slug}"]`);
  await expect(item.locator('[data-testid="miniapp-viewer"]')).toHaveAttribute("data-status", "ready", { timeout: 15_000 });
  await expect(page).toHaveURL(new RegExp(`[?&]app=${slug}`));
  return item;
}

export function miniappFrame(page: Page, slug: string) {
  return page.locator(`[data-testid="feed-item"][data-slug="${slug}"] iframe`).contentFrame();
}
