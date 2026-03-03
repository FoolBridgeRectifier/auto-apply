import { chromium, test } from '@playwright/test';
import { openEmail, openJobRight } from './page-loaders';
import { jobRightAppliedButton } from './page-loaders/job-right/selectors';
import { incrementApplications, closeOverlay } from './components';
import { chromium as playwrightExtra } from 'playwright-extra';

import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { isMocked } from '../config';
import { applicationPageHarMock } from './mocks';
import { fillApplication } from './main';
import { loadResumeText } from './page-loaders/chat-gpt';

playwrightExtra.use(stealthPlugin());

test.beforeAll(async () => {
  await loadResumeText();
});

test.afterAll(() => {
  closeOverlay();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(0);
});

const runTestFunctions = {
  run: !isMocked ? test : test.skip,
  test: isMocked ? test : test.skip,
};

runTestFunctions.run('main', async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const emailPage = context.pages()[0] || (await context.newPage());
  const pages = context.pages();
  for (const page of pages) {
    if (page !== emailPage) {
      await page.close();
    }
  }

  const chatGptPage = await context.newPage();
  await emailPage.goto('https://mail.google.com/mail/u/0/#inbox');
  await chatGptPage.goto(
    'https://chatgpt.com/c/6965ae37-de54-8332-ba71-4a66c8ba831f'
  );

  const { getEmail } = await openEmail();
  const jobRightPage = await context.newPage();
  const applyButtons = await openJobRight(jobRightPage);

  for (const applyButton of applyButtons) {
    const [applicationPage] = await Promise.all([
      context.waitForEvent('page'), // Wait for the new page to open
      applyButton.click(), // Click the apply button
    ]);

    await fillApplication(applicationPage, getEmail);

    // Wait indefinitely for the applicationPage to close
    incrementApplications();
    await applicationPage.waitForEvent('close');
    await jobRightAppliedButton(jobRightPage).click();
  }
});

test.describe('debug', () => {
  test.afterEach(async ({ page }) => {
    // Wait for any remaining pages to close before proceeding
    await page.waitForEvent('close');
  });

  runTestFunctions.test(
    'test',
    async ({ page: _debugPage, context: debugContext }) => {
      const isDebugMode =
        process.env.PWDEBUG === '1' || process.env.PWDEBUG === 'console';
      if (isDebugMode) {
        const applicationPage = await debugContext.newPage();

        const { getEmail } = await openEmail();
        await applicationPageHarMock(applicationPage);

        await fillApplication(applicationPage, getEmail);
      } else {
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        const context = browser.contexts()[0];
        const emailPage = context.pages()[0] || (await context.newPage());

        const pages = context.pages();
        for (const page of pages) {
          if (page !== emailPage) {
            await page.close();
          }
        }

        const { getEmail } = await openEmail();

        const applicationPage = await context.newPage();
        await applicationPageHarMock(applicationPage);

        await fillApplication(applicationPage, getEmail);
      }
    }
  );
});
