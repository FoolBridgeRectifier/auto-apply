import { Page } from "@playwright/test";
import { selectors } from "./selectors";
import { FORM_FIELDS, TIMEOUTS } from "../../../config";
import { generalFill } from "../general";
import { basicButtonClick } from "../../helpers";
import { autofillButton, setAutoplay } from "../../components";
import { filterTimesEmail } from "./helpers";
import { IGeneralFillResponse } from "../general/interfaces";
import { bindSaveToButton } from "../helpers";
import { dropdownComponent } from "../general/components";

export const greenhouseFlow = async (
  page: Page,
  emailPage: Page,
  chatPage: Page,
) => {
  try {
    await page.waitForLoadState("domcontentloaded", TIMEOUTS.PAGE_START_SHORT);
  } catch {}

  await autofillButton(page, false);
  const missedQuestions: IGeneralFillResponse = await generalFill(page, {
    resumeFileSetter: true,
  });

  await bindSaveToButton(
    "saveOnSubmit",
    page,
    selectors(page).submitApplicationButton.last(),
    missedQuestions,
    dropdownComponent,
  );

  // try {
  //   await selectors(page).securityCodeInput.waitFor({
  //     state: "visible",
  //     timeout: 0,
  //   });

  //   const times = filterTimesEmail();
  //   await emailPage
  //     .getByText(new RegExp(times, "i"))
  //     .first()
  //     .isVisible(TIMEOUTS.PAGE_START);
  //   const code =
  //     await selectors(emailPage).extractSecurityCodeFromInstruction();

  //   if (code) {
  //     await selectors(page).securityCodeInput.fill(code);
  //   }
  //   await selectors(page).submitApplicationButton.click();
  // } catch (e) {
  //   console.log("GG", e);
  // }
};



