import { Page } from '@playwright/test';
import { selectors } from './selectors';
import { jobRightApplicationMock } from '../../mocks';

export const openJobRight = async (page: Page) => {
  // Wait for the new Google Sign-In window
  await page.goto('https://jobright.ai/jobs/recommend');
  // for (let i = 0; i < JOBRIGHT_PAGE_RETRY; i++) {
  //   await page.goto("https://jobright.ai/");
  //   try {
  //     await page.waitForLoadState("networkidle", TIMEOUTS.PAGE_START);
  //   } catch {}

  //   await selectors(page).signInButton.click();

  //   try {
  //     const [googleSignInPage] = await Promise.all([
  //       page.waitForEvent("popup", TIMEOUTS.PAGE_START), // Wait for a new page to open
  //       selectors(page).signInGoogleButton.click(), // Trigger the Google Sign-In
  //     ]);
  //     await selectors(googleSignInPage).emailLink.click();
  //     break;
  //   } catch {}
  // }

  await jobRightApplicationMock(page);

  await selectors(page).applyButtons.first().waitFor();
  const applyButtons = await selectors(page).applyButtons.all();

  return applyButtons;
};
