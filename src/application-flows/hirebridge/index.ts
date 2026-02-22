import { Page } from "@playwright/test";
import { selectors } from "./selectors";
import { FORM_FIELDS, TIMEOUTS } from "../../../config";
import { generalFill } from "../general";
import { autofillButton } from "../../components";

export const hirebridgeFlow = async (page: Page, emailPage: Page, chatPage: Page) => {
  const [popupPage] = await Promise.all([
    page.waitForEvent("popup"),
    selectors(page).applyButton.click(),
  ]);

  await autofillButton(popupPage);

  // page 1
  await selectors(popupPage).popupCookieContinue.click(TIMEOUTS.CLICK);
  await selectors(popupPage).popupEmail.fill(
    FORM_FIELDS.PERSONAL_DETAILS.EMAIL,
    TIMEOUTS.CLICK,
  );
  await selectors(popupPage).popupNext.click(TIMEOUTS.CLICK);

  // page 2
  await selectors(popupPage)
    .popupEmail.nth(1)
    .fill(FORM_FIELDS.PERSONAL_DETAILS.EMAIL, TIMEOUTS.CLICK);
  await selectors(popupPage).popupNext.click(TIMEOUTS.CLICK);

  await selectors(popupPage).popupForm.waitFor(TIMEOUTS.PAGE_START);

  // fill
  await popupPage.waitForLoadState("networkidle", TIMEOUTS.PAGE_START);
  await generalFill(popupPage);

  // fill rest
  await selectors(popupPage).sponsorshipDropdown.selectOption(
    "Yes",
    TIMEOUTS.CLICK,
  );
  await selectors(popupPage).signatureName.fill(
    `${FORM_FIELDS.PERSONAL_DETAILS.FIRST_NAME} ${FORM_FIELDS.PERSONAL_DETAILS.LAST_NAME}`,
    TIMEOUTS.CLICK,
  );

  // submit
  await selectors(popupPage).popupNext.first().click(TIMEOUTS.CLICK);
  await popupPage.close();
  await page.close();
};
