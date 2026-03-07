import type { Page } from 'playwright';
import { selectors } from './selectors';
import { jobRightApplicationMock } from '../../mocks';

export const openJobRight = async (page: Page) => {
  // Wait for the new Google Sign-In window
  await page.goto('https://jobright.ai/jobs/recommend');

  await jobRightApplicationMock(page);

  await selectors(page).applyButtons.first().waitFor();
  const applyButtons = await selectors(page).applyButtons.all();

  return applyButtons;
};
