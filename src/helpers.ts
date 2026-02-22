import { Page } from "@playwright/test";
import { TIMEOUTS } from "../config";

export const basicButtonClick = async (
  page: Page,
  text = "allow|accept",
  timeout = TIMEOUTS.CLICK,
) => {
  try {
    const applyButton = page
      .locator("a, button")
      .filter({ hasText: new RegExp(text, "i") })
      .first();
    if (await applyButton.isVisible(timeout)) {
      await applyButton.click();
    }
  } catch {
    console.log(`No ${text} button`);
  }
};
