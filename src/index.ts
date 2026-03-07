import { spawn } from 'child_process';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { isMocked, TIMEOUTS } from '../config';
import { applicationPageHarMock } from './mocks';
import { fillApplication } from './main';
import { openEmail, openJobRight } from './page-loaders';
import { loadResumeText } from './page-loaders/chat-gpt';
import { jobRightAppliedButton } from './page-loaders/job-right/selectors';
import {
  incrementApplications,
  closeOverlay,
  getChromePath,
  autofillButton,
} from './components';

chromium.use(stealthPlugin());

const connectOrLaunch = async () => {
  try {
    return await chromium.connectOverCDP('http://localhost:9222');
  } catch {
    spawn(
      getChromePath(),
      [
        '--remote-debugging-port=9222',
        '--user-data-dir=C:\\temp\\chrome_dev_profile',
      ],
      { detached: true, stdio: 'ignore' }
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await chromium.connectOverCDP('http://localhost:9222');
  }
};

const run = async () => {
  await loadResumeText();
  const browser = await connectOrLaunch();
  browser.on('disconnected', () => process.exit(0));
  const context = browser.contexts()[0];
  context.setDefaultTimeout(TIMEOUTS.DEFAULT);

  const pages = context.pages();
  const firstPage = context.pages()[0] || (await context.newPage());
  for (const page of pages) {
    if (page !== firstPage) {
      await page.close();
    }
  }
  await autofillButton(firstPage);

  if (isMocked) {
    const { getEmail } = await openEmail();
    await applicationPageHarMock(firstPage);
    await fillApplication(firstPage, getEmail);

    await firstPage.waitForEvent('close');
    await context.close();
  } else {
    firstPage.goto('https://mail.google.com/mail/u/0/#inbox');
    const { getEmail } = await openEmail();
    const jobRightPage = await context.newPage();
    const applyButtons = await openJobRight(jobRightPage);

    for (const applyButton of applyButtons) {
      const [applicationPage] = await Promise.all([
        context.waitForEvent('page'),
        applyButton.click(),
      ]);

      await fillApplication(applicationPage, getEmail);

      incrementApplications();
      if (!applicationPage.isClosed()) {
        await applicationPage.waitForEvent('close');
      }
      await jobRightAppliedButton(jobRightPage).click();
    }
  }

  closeOverlay();
};

run().catch(console.error);
