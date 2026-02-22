import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get applyButton() {
    // match <a> with class containing "apply-link-marker" and visible text "Apply"
    return page.locator('a.apply-link-marker:has-text("Apply")').first();
  },
});
