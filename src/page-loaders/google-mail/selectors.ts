import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get emailInput() {
    return page.getByLabel("Email or phone");
  },
  get passwordInput() {
    return page.getByLabel("Enter your password");
  },
  get continueButton() {
    return page.getByRole("button", { name: "Next" });
  },
  get composeButton() {
    return page.getByText("Compose");
  },
  get notNowButton() {
    return page.getByText("Not now");
  },
  get cancelButton() {
    return page.getByText("Cancel");
  },
  get skipButton() {
    return page.getByText("Skip");
  },
});
