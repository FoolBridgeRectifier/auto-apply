import { Page } from '@playwright/test';
import { selectors } from './selectors';
import { TIMEOUTS } from '../../../config';
import { generalFill } from '../general';
import { autofillButton } from '../../components';
import { bindSaveToButton } from '../helpers';
import { dropdownComponent, radioComponent } from '../general/components';

export const ashbyFlow = async (page: Page) => {
  try {
    await page.waitForLoadState('domcontentloaded', TIMEOUTS.PAGE_START_SHORT);
  } catch {}

  await autofillButton(page);
  const [missedQuestions] = await Promise.all([
    generalFill(page, {
      resumeFileSetter: true,
      text: true,
      dropdown: true,
      radio: true,
    }),
    generalFill(
      page,
      {
        resume: true,
      },
      { dropdownComponent, radioComponent }
    ),
  ]);

  await bindSaveToButton(
    'saveOnSubmit',
    page,
    selectors(page).submitApplicationButton.last(),
    missedQuestions,
    dropdownComponent
  );
};
