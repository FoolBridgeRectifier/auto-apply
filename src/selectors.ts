import { Page } from "@playwright/test";

export const selectors = async (page: Page) => ({
  get jobRightAppliedButton() {
    return page.getByText("Yes, I applied!"); // Use getBy style for user profile
  },
});
