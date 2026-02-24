import { Page } from '@playwright/test';
import { selectors } from './selectors';
import { TIMEOUTS } from '../../../config';
import { generalFill } from '../general';
import { basicButtonClick } from '../../helpers';
import { autofillButton } from '../../components';
import { WORKDAY_PAGES } from './enums';
import { dropdownComponent, radioComponent } from './components';
import { bindSaveToButton } from '../helpers';
import { IGeneralFillResponse } from '../general/interfaces';
import { gmail_v1 } from 'googleapis';

export const workdayFlow = async (
  page: Page,
  getEmail: () => Promise<gmail_v1.Schema$Message>
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

  await autofillButton(page, false);

  try {
    await selectors(page).autoFillWithResumeButton.click(TIMEOUTS.PAGE_START);
  } catch (err) {
    console.warn('workdayFlow: apply page failed', err);
  }

  let isSignedUp = false;
  const isLoggedIn = false;
  while (page) {
    try {
      await page.waitForLoadState('networkidle', TIMEOUTS.PAGE_START_SHORT);
    } catch {}
    const pageName = await (await selectors(page).getInitialPage).jsonValue();

    // signup page
    if (pageName === WORKDAY_PAGES.SIGNUP && !isSignedUp) {
      try {
        await generalFill(
          page,
          { resume: true },
          { dropdownComponent, radioComponent }
        );
        await page.waitForTimeout(200);
        await selectors(page).loginCreateAccountButton.click(TIMEOUTS.CLICK);
        isSignedUp = true;
      } catch (err) {
        console.warn('workdayFlow: signup page failed', err);
      }
    }

    // page 1 - resume page
    if (pageName === WORKDAY_PAGES.RESUME) {
      try {
        await generalFill(page, { text: true });
        await selectors(page).resumeUploaded;
        await selectors(page).continueButton.click(TIMEOUTS.CLICK);
      } catch (err) {
        console.warn('workdayFlow: resume page failed', err);
      } finally {
        break;
      }
    }
  }

  // page 3 - personal details
  try {
    await selectors(page).personalPage.waitFor();

    // Referral input
    try {
      await selectors(page).referralInput.click(TIMEOUTS.PAGE_START);
      await selectors(page).referralSelect1.click(TIMEOUTS.PAGE_START_SHORT);
      await selectors(page).referralSelect2.click(TIMEOUTS.PAGE_START_SHORT);
    } catch {
      console.log('Referral input not found');
    }

    const personalQuestionsMissed: IGeneralFillResponse = await generalFill(
      page,
      { resume: true },
      { dropdownComponent, radioComponent }
    );

    // await bindSaveToButton(
    //   "personalSave",
    //   page,
    //   selectors(page).continueButton.last(),
    //   personalQuestionsMissed,
    //   dropdownComponent,
    // );
  } catch (err) {
    console.warn('workdayFlow: personal details page failed', err);
  }

  // page 4 - experience details (education + skills)
  try {
    await selectors(page).experiencePage.waitFor();
    // education
    await selectors(page).addEducationButton.isVisible();
    while (page && (await selectors(page).addEducationButton.isVisible())) {
      await selectors(page).addEducationButton.click();
    }

    // skills
    // await selectors(page).skillsTextClick.isVisible();
    // for (const skill of FORM_FIELDS.SKILLS) {
    //   await selectors(page).skillsTextClick.click();
    //   await selectors(page).skillsTextInput.isVisible();
    //   await selectors(page).skillsTextInput.clear();
    //   await selectors(page).skillsTextInput.click();
    //   await selectors(page).skillsTextInput.fill(skill);
    //   await selectors(page).skillsTextInput.press("Enter");
    //   try {
    //     await page.getByText(skill).first().click({ timeout: 5000 });
    //   } catch {}
    // }

    // autofill
    const experienceQuestionsMissed: IGeneralFillResponse = await generalFill(
      page,
      { resume: true },
      { dropdownComponent, radioComponent }
    );

    // await bindSaveToButton(
    //   "experienceSave",
    //   page,
    //   selectors(page).continueButton.last(),
    //   experienceQuestionsMissed,
    //   dropdownComponent,
    // );
  } catch (err) {
    console.warn('workdayFlow: experience/education/skills page failed', err);
  }

  // page 5 - application questions
  try {
    await selectors(page).extraQuestionsPage.waitFor();

    // autofill
    const extraQuestionsMissed: IGeneralFillResponse = await generalFill(
      page,
      { resume: true },
      { dropdownComponent, radioComponent }
    );

    await bindSaveToButton(
      'applicationSave',
      page,
      selectors(page).continueButton.last(),
      extraQuestionsMissed,
      dropdownComponent
    );
  } catch (err) {
    console.warn('workdayFlow: application questions failed', err);
  }

  // page 6 - disclosure questions
  try {
    await selectors(page).disclosurePage.waitFor();

    // autofill
    const disclosureQuestionsMissed: IGeneralFillResponse = await generalFill(
      page,
      { resume: true },
      { dropdownComponent, radioComponent }
    );

    await bindSaveToButton(
      'disclosureSave',
      page,
      selectors(page).continueButton.last(),
      disclosureQuestionsMissed,
      dropdownComponent
    );
  } catch (err) {
    console.warn('workdayFlow:disclosure page failed', err);
  }

  // page 7 - identity questions
  try {
    await selectors(page).identityPage.waitFor();

    // autofill
    const identityQuestionsMissed: IGeneralFillResponse = await generalFill(
      page,
      { resume: true },
      { dropdownComponent, radioComponent }
    );

    await bindSaveToButton(
      'identitySave',
      page,
      selectors(page).continueButton.last(),
      identityQuestionsMissed,
      dropdownComponent
    );
  } catch (err) {
    console.warn('workdayFlow: identity page failed', err);
  }
  // await selectors(page).experiencePage;
  // await selectors(page).addEducationButton.click();
  // await selectors(page).addSchoolInput.fill(FORM_FIELDS.COLLEGES.MASTERS.NAME);

  // await selectors(page).educationDegreeButton.click();
  // await selectors(page).educationDegreeSelect.click();
};
