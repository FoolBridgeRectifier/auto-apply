import { Page } from '@playwright/test';
import { generalFill } from '../application-flows/general';
import { TIMEOUTS } from '../../config';
import {
  clickFillButtonStyle,
  counterStyle,
  overlayDivStyle,
  toggleButtonStyle,
} from './styles';
import { syncFile } from './helpers';

declare global {
  interface Window {
    generalFill?: () => Promise<void>;
    attachElements?: () => Promise<void>;
    __autofill_observer_added?: boolean;
    __notifyUrlChange?: (msg?: string) => void;
    __autofill_autoplay?: boolean;
    __autofill_key_listener_added?: boolean;
    // callbacks exposed by Playwright
    getAutofillAutoplay?: () => Promise<boolean>;
    setAutofillAutoplay?: (v?: boolean) => Promise<boolean>;
  }
}

// module-level autoplay state and accessor/mutator
let autoplay = false;
const syncedData = syncFile();
let applicationsTotal = syncedData.applicationsTotal;
let applicationsToday = syncedData.applicationsToday;
let applicationsTwoDays = syncedData.applicationsTwoDays;

export const incrementApplications = () => {
  syncedData.incrementApplications();
  applicationsTotal += 1;
  applicationsToday += 1;
  applicationsTwoDays += 1;
};

const exposeAutoplayCallbacks = async (page: Page) => {
  const alreadyExposed = await page.evaluate(() =>
    Boolean(window.getAutofillAutoplay)
  );
  if (!alreadyExposed) {
    try {
      await page.exposeFunction('getAutofillAutoplay', async () => autoplay);
      await page.exposeFunction('setAutofillAutoplay', async (v?: boolean) => {
        if (typeof v === 'boolean') autoplay = v;
        else autoplay = !autoplay;
        return autoplay;
      });
    } catch {
      // ignore races
    }
  }
};

const exposeGeneralFill = async (page: Page) => {
  const alreadyExposed = await page.evaluate(() => Boolean(window.generalFill));
  if (!alreadyExposed) {
    try {
      await page.exposeFunction(
        'generalFill',
        async () => await generalFill(page)
      );
    } catch {
      // ignore races
    }
  }
};

const injectButtons = async (page: Page) => {
  await page.evaluate(
    ({
      overlayDivStyle,
      toggleButtonStyle,
      clickFillButtonStyle,
      counterStyle,
      applicationsTotal,
      applicationsToday,
      applicationsTwoDays,
      autoplay,
    }) => {
      if (!document.getElementById(overlayDivStyle.id)) {
        // Counter
        const counter = document.createElement('div');
        counter.id = counterStyle.id;

        const totalCounter = document.createElement('div');
        totalCounter.textContent = `total: ${applicationsTotal.toString()}`;

        const todayCounter = document.createElement('div');
        todayCounter.textContent = `today: ${applicationsToday.toString()}`;

        const twoDaysCounter = document.createElement('div');
        twoDaysCounter.textContent = `2 days: ${applicationsTwoDays.toString()}`;

        counter.appendChild(totalCounter);
        counter.appendChild(twoDaysCounter);
        counter.appendChild(todayCounter);

        // overlay container
        const overlay = document.createElement('div');
        overlay.id = overlayDivStyle.id;

        // buttons
        const toggleButton = document.createElement('button');
        toggleButton.id = toggleButtonStyle.id;
        toggleButton.textContent = autoplay
          ? toggleButtonStyle.textContent.pause
          : toggleButtonStyle.textContent.play;
        toggleButton.addEventListener('click', async () => {
          toggleButton.textContent = (await window.setAutofillAutoplay?.())
            ? toggleButtonStyle.textContent.pause
            : toggleButtonStyle.textContent.play;
        });

        const clickButton = document.createElement('button');
        clickButton.id = clickFillButtonStyle.id;
        clickButton.textContent = clickFillButtonStyle.textContent;
        clickButton.addEventListener('click', () => {
          window.generalFill?.();
        });

        const styleElement = document.createElement('style');
        styleElement.textContent = [
          overlayDivStyle,
          toggleButtonStyle,
          clickFillButtonStyle,
          counterStyle,
        ]
          .map(
            ({ id, style }) => `#${id}{
            ${style}
          }`
          )
          .join('\n');

        overlay.appendChild(toggleButton);
        overlay.appendChild(clickButton);

        document.body.appendChild(overlay);
        document.body.appendChild(counter);
        document.head.appendChild(styleElement);
      }
    },
    {
      overlayDivStyle,
      toggleButtonStyle,
      clickFillButtonStyle,
      counterStyle,
      applicationsTotal,
      applicationsToday,
      applicationsTwoDays,
      autoplay,
    }
  );
};

const setupOnKeyPress = async (page: Page) => {
  await page.evaluate(() => {
    if (window.__autofill_key_listener_added) return;

    // Trigger autofill on Shift+1 (i.e. "!" or Shift+1)
    const handler = (e: KeyboardEvent) => {
      const isShift1 = e.key === '!' || (e.key === '1' && e.shiftKey);
      if (isShift1) {
        window.generalFill?.();
      }
    };

    document.addEventListener('keydown', handler);
    window.__autofill_key_listener_added = true;
  });
};

const attachElements = async (page: Page) => {
  try {
    await page.waitForLoadState('domcontentloaded', TIMEOUTS.PAGE_START);
  } catch {}

  await exposeGeneralFill(page);
  await injectButtons(page);
  await setupOnKeyPress(page);
  // autoplay && await generalFill(page);
};

const exposeAttachElements = async (page: Page) => {
  const alreadyExposed = await page.evaluate(() =>
    Boolean(window.attachElements)
  );
  if (!alreadyExposed) {
    try {
      await page.exposeFunction(
        'attachElements',
        async () => await attachElements(page)
      );
    } catch {
      // ignore races
    }
  }
};

const setupNavigationHandlers = async (page: Page) => {
  page.on('popup', async (popup) => attachElements(popup));
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) await attachElements(page);
  });
  page.context().on('page', async (popup) => attachElements(popup));

  await page.evaluate(() => {
    const patch = (objName: 'pushState' | 'replaceState', orig: (...args: unknown[]) => unknown) => {
      const original = orig.bind(history);
      history[objName] = async function (...args: unknown[]) {
        const res = original(...args);
        if (window.attachElements) await window.attachElements();
        return res;
      };
    };

    patch('pushState', history.pushState);
    patch('replaceState', history.replaceState);
    window.addEventListener('popstate', async () => {
      if (window.attachElements) await window.attachElements();
    });

    const observer = new MutationObserver(async () => {
      if (
        !document.getElementById('__autofill_btn') ||
        !document.getElementById('__autofill_toggle')
      ) {
        if (window.attachElements) await window.attachElements();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const autofillButton = async (
  page: Page,
  isAutofill: boolean = false
) => {
  autoplay = isAutofill;
  await exposeAutoplayCallbacks(page);
  await exposeAttachElements(page);
  await attachElements(page);
  await setupNavigationHandlers(page);
  if (autoplay) {
    await generalFill(page);
    // page.evaluate(() => window.scrollTo(0, 0));
  }
};
