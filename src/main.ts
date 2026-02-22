import { Page } from "@playwright/test";
import { routes } from "./routes";
import { basicButtonClick } from "./helpers";
import { autofillButton } from "./components";
import { generalFill } from "./application-flows";
import { IGeneralFillResponse } from "./application-flows/general/interfaces";
import { bindSaveToButton } from "./application-flows/helpers";
import { dropdownComponent } from "./application-flows/general/components";

export const fillApplication = async (
  applicationPage: Page,
  emailPage: Page,
  chatGptPage: Page,
) => {
  try {
    await applicationPage.waitForLoadState("networkidle", { timeout: 2000 });
  } catch {}

  try {
    const url = applicationPage.url();
    const applicationFlow = Object.values(routes).find((route) =>
      url.includes(route.url),
    );

    if (applicationFlow) {
      try {
        await applicationFlow.flow(applicationPage, emailPage, chatGptPage);
      } catch {}
    } else {
      await basicButtonClick(applicationPage);
      await basicButtonClick(applicationPage, "^(?!.*linkedin).*\\bapply\\b");

      await autofillButton(applicationPage);
      try {
        const missedQuestions: IGeneralFillResponse = await generalFill(
          applicationPage,
          {
            resumeFileSetter: true,
          },
        );

        if (
          await applicationPage
            .locator("a, button")
            .filter({ hasText: new RegExp("submit", "i") })
            .isVisible()
        ) {
          await bindSaveToButton(
            "saveOnSubmit",
            applicationPage,
            applicationPage
              .locator("a, button")
              .filter({ hasText: new RegExp("submit", "i") }),
            missedQuestions,
            dropdownComponent,
          );
        }
      } catch {}
    }
  } catch (e) {
    console.error("Application Error", e);
  }
};
