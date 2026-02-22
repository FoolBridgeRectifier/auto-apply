import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get applyButton() {
    return page.locator("a#applynow");
  },
  get popupCookieContinue() {
    return page.getByText("Continue");
  },
  get popupEmail() {
    return page.locator('input[type="email"]');
  },
  get popupNext() {
    return page.locator('input[type="submit"]');
  },
  get popupResume() {
    return page.locator('input[type="file"]');
  },
  get popupForm() {
    return page.getByLabel("First Name");
  },
  get signatureName() {
    return page.getByLabel("Type Your Full Name Here");
  },
  get sponsorshipDropdown() {
    const attributeChecks = [
      "id",
      "name",
      "class",
      "aria-label",
      "data-fv-field",
    ];
    const selector = attributeChecks
      .map((attr) => `select[${attr}*="sponsorship"]`)
      .join(", ");
    return page.locator(selector);
  },
});
