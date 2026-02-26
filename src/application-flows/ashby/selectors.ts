import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get submitApplicationButton() {
    return page.locator('button[type="submit"]');
  },
});
