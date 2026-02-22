import { expect, Page } from "@playwright/test";
import { selectors } from "./selectors";
import { FORM_FIELDS } from "../../../config";

export const openEmail = async (page: Page) => {
  await page.goto("http://mail.google.com/mail/"); 

  // await selectors(page).emailInput.fill(FORM_FIELDS.PERSONAL_DETAILS.EMAIL);
  // await selectors(page).continueButton.click();

  // await selectors(page).passwordInput.fill(
  //   FORM_FIELDS.PERSONAL_DETAILS.LOGIN.SECONDARY_PASSWORD,
  // );
  // await selectors(page).continueButton.click();

  // // Wait for either composeButton or notNowButton to appear
  // await Promise.race([
  //   selectors(page)
  //     .composeButton.waitFor({ state: "visible" })
  //     .then(() => null),
  //   selectors(page)
  //     .notNowButton.waitFor({ state: "visible" })
  //     .then(async () => {
  //       await selectors(page).notNowButton.click();
  //       await selectors(page).cancelButton.click();
  //     }),
  // ]);
};
