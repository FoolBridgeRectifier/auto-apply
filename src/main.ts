import { Page } from '@playwright/test';
import { routes } from './routes';
import { basicButtonClick } from './helpers';
import { autofillButton } from './components';
import { generalFill } from './application-flows';
import { IGeneralFillResponse } from './application-flows/general/interfaces';
import { bindSaveToButton } from './application-flows/helpers';
import { dropdownComponent } from './application-flows/general/components';
import { gmail_v1 } from 'googleapis';

export const fillApplication = async (
  applicationPage: Page,
  getEmail: () => Promise<gmail_v1.Schema$Message>
) => {
  try {
    await applicationPage.waitForLoadState('networkidle', { timeout: 2000 });
  } catch {}

  try {
    const url = applicationPage.url();
    const applicationFlow = Object.values(routes).find((route) =>
      url.includes(route.url)
    );

    if (applicationFlow) {
      try {
        await applicationFlow.flow(applicationPage, getEmail);
      } catch {}
    } else {
      // await basicButtonClick(applicationPage);
      // await basicButtonClick(applicationPage, '^(?!.*linkedin).*\\bapply\\b');
      // await autofillButton(applicationPage);
      // try {
      //   const missedQuestions: IGeneralFillResponse = await generalFill(
      //     applicationPage,
      //     {
      //       resumeFileSetter: true,
      //     }
      //   );
      //   if (
      //     await applicationPage
      //       .locator('a, button')
      //       .filter({ hasText: new RegExp('submit', 'i') })
      //       .isVisible()
      //   ) {
      //     await bindSaveToButton(
      //       'saveOnSubmit',
      //       applicationPage,
      //       applicationPage
      //         .locator('a, button')
      //         .filter({ hasText: new RegExp('submit', 'i') }),
      //       missedQuestions,
      //       dropdownComponent
      //     );
      //   }
      // } catch {}
    }
  } catch (e) {
    console.error('Application Error', e);
  }
};
