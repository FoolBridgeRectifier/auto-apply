import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get signInButton() {
    return page.getByText("SIGN IN").first();
  },
  get signInGoogleButton() {
    return page.getByTitle("Sign in with Google Button"); // Matches either text
  },
  get emailLink() {
    return page.getByRole("link", { name: "Sathya Somasunder" }); // Use getBy style for user profile
  },
  get applyButtons() {
    return page.locator("button", {
      hasText: /APPLY NOW|Apply with Autofill/i,
    }); // Matches buttons with either text
  },
});

export const jobRightAppliedButton = (page: Page) =>
  page.getByText("Yes, I applied!");
