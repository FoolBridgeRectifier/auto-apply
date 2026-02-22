import { Page } from "@playwright/test";

export const selectors = (page: Page) => ({
  get signInButton() {
    return page.getByText("Log in").first();
  },
  get signInGoogleButton() {
    return page.getByText("Continue with Google"); // Matches either text
  },
  get chatTab() {
    return page.getByText("Resume Optimization Advice").all(); // Use getBy style for user profile
  },
  get chatInput() {
    return page.getByPlaceholder("Ask anything"); // Use getBy style for user profile
  },
});
