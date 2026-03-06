import { Page } from '@playwright/test';
import { selectors } from './selectors';
import { TIMEOUTS } from '../../../config';
import { generalFill } from '../general';
import { basicButtonClick } from '../../helpers';
import { autofillButton } from '../../components';
import { WORKDAY_PAGES } from './enums';
import { dropdownComponent, radioComponent } from './components';
import { gmail_v1 } from 'googleapis';

export const workdayFlow = async (
  page: Page,
  _getEmail: () => Promise<gmail_v1.Schema$Message>
) => {
  try {
    await page.waitForLoadState('networkidle', TIMEOUTS.PAGE_START_SHORT);
  } catch {}
  // apply page
  try {
    await basicButtonClick(page);
    await basicButtonClick(page, 'apply');
  } catch (err) {
    console.warn('workdayFlow: apply page failed', err);
  }

  await autofillButton(page);

  try {
    await selectors(page).autoFillWithResumeButton.click(TIMEOUTS.PAGE_START);
  } catch (err) {
    console.warn('workdayFlow: apply page failed', err);
  }

  const pageVisited = {
    isSignedUp: false,
    isResume: false,
    isPersonal: false,
    isExperience: false,
    isApplication: false,
    isDisclosure: false,
    isIdentity: false,
  };
  while (page) {
    try {
      await page.waitForLoadState('networkidle', TIMEOUTS.PAGE_START_SHORT);
    } catch {}
    const pageName = await (await selectors(page).getInitialPage).jsonValue();

    // signup page
    if (pageName === WORKDAY_PAGES.SIGNUP && !pageVisited.isSignedUp) {
      try {
        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );
        await page.waitForTimeout(200);
        await selectors(page).loginCreateAccountButton.click(TIMEOUTS.CLICK);
        pageVisited.isSignedUp = true;
      } catch (err) {
        console.warn('workdayFlow: signup page failed', err);
      }
    }

    // page 1 - resume page
    if (pageName === WORKDAY_PAGES.RESUME && !pageVisited.isResume) {
      try {
        await generalFill(page, { text: true });
        await selectors(page).resumeUploaded;
        await selectors(page).continueButton.click(TIMEOUTS.CLICK);
        pageVisited.isResume = true;
      } catch (err) {
        console.warn('workdayFlow: resume page failed', err);
      }
      break;
    }
  }

  // After login
  while (page) {
    // page 3 - personal details
    try {
      if (
        (await selectors(page).personalPage.isVisible(TIMEOUTS.CLICK)) &&
        !pageVisited.isPersonal
      ) {
        await selectors(page).personalPage.waitFor();

        // Referral input
        try {
          await selectors(page).referralInput.click(TIMEOUTS.PAGE_START);
          await selectors(page).referralSelect1.click(
            TIMEOUTS.PAGE_START_SHORT
          );
          await selectors(page).referralSelect2.click(
            TIMEOUTS.PAGE_START_SHORT
          );
        } catch {
          console.log('Referral input not found');
        }

        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );

        pageVisited.isPersonal = true;
      }
    } catch (err) {
      console.warn('workdayFlow: personal details page failed', err);
    }

    // page 4 - experience details (education + skills)
    try {
      if (
        (await selectors(page).experiencePage.isVisible({ timeout: 100 })) &&
        !pageVisited.isExperience
      ) {
        // education
        // await selectors(page).addEducationButton.isVisible();
        // while (page && (await selectors(page).addEducationButton.isVisible())) {
        //   await selectors(page).addEducationButton.click();
        // }

        // autofill
        // const experienceQuestionsMissed: IGeneralFillResponse =
        //   await generalFill(
        //     page,
        //     { resume: true },
        //     { dropdownComponent, radioComponent }
        //   );

        pageVisited.isExperience = true;
      }
    } catch (err) {
      console.warn('workdayFlow: experience/education/skills page failed', err);
    }

    // page 5 - application questions
    try {
      if (
        (await selectors(page).extraQuestionsPage.isVisible({
          timeout: 100,
        })) &&
        !pageVisited.isApplication
      ) {
        // autofill
        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );

        pageVisited.isApplication = true;
      }
    } catch (err) {
      console.warn('workdayFlow: application questions failed', err);
    }

    // page 6 - disclosure questions
    try {
      if (
        (await selectors(page).disclosurePage.isVisible({ timeout: 100 })) &&
        !pageVisited.isDisclosure
      ) {
        // autofill

        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );

        pageVisited.isDisclosure = true;
      }
    } catch (err) {
      console.warn('workdayFlow:disclosure page failed', err);
    }

    // page 7 - identity questions
    try {
      if (
        (await selectors(page).identityPage.isVisible({ timeout: 100 })) &&
        !pageVisited.isIdentity
      ) {
        // autofill
        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );

        pageVisited.isIdentity = true;
        break;
      }
    } catch (err) {
      console.warn('workdayFlow: identity page failed', err);
    }
  }
};
