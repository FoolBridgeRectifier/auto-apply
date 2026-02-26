import { Page } from '@playwright/test';
import { selectors } from './selectors';
import { TIMEOUTS } from '../../../config';
import { generalFill } from '../general';
import { autofillButton } from '../../components';
import { bindSaveToButton } from '../helpers';
import { gmail_v1 } from 'googleapis';
import { dropdownComponent } from './components';
import { radioComponent } from '../general/components';

export const ashbyFlow = async (
  page: Page,
  getEmail: () => Promise<gmail_v1.Schema$Message>
) => {
  try {
    await page.waitForLoadState('domcontentloaded', TIMEOUTS.PAGE_START_SHORT);
  } catch {}

  await autofillButton(page, false);
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

  try {
    await selectors(page).securityCodeInput.waitFor({
      state: 'visible',
      timeout: 0,
    });

    const email = await getEmail();
    const code = (email.snippet || '').match(
      /application: ([a-zA-Z0-9]+)/
    )?.[1];

    if (code) {
      await selectors(page).securityCodeInput.fill(code);
    }
    await selectors(page).submitApplicationButton.click();
  } catch (e) {
    console.log('GG', e);
  }
};
