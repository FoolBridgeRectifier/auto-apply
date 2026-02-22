import { Page } from "@playwright/test";
import { selectors } from "./selectors";
import { TIMEOUTS } from "../../../config";

export const openChatGpt = async (page: Page) => {
  await page.goto("https://chatgpt.com/");

  // await selectors(page).signInButton.click(TIMEOUTS.PAGE_START);

  // await selectors(page).signInGoogleButton.click(TIMEOUTS.PAGE_START);

  await selectors(page).chatInput.first().isVisible(TIMEOUTS.PAGE_START);

  return selectors(page).chatInput.first();
};
