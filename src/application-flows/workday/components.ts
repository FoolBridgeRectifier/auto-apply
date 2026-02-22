import { Locator, Page } from "@playwright/test";
import { TIMEOUTS } from "../../../config";
import { IRadioComponent } from "../interfaces";

const getAllDropdownOptions = async (dropdown: Locator, page: Page) => {
  await page.click("body");
  await dropdown.click(TIMEOUTS.CLICK);
  await page.waitForTimeout(TIMEOUTS.FIND.timeout);
  const optionsLocators = await page
    .locator('[visibility="opened"]')
    .getByRole("option")
    .all();
  const options = [];

  for (const optionsLocator of optionsLocators) {
    const label =
      (await optionsLocator.textContent(TIMEOUTS.FIND))?.trim() ?? "";
    options.push({ locator: optionsLocator, label });
  }

  return options;
};

export const dropdownComponent = {
  allLocator: async (page: Page) => {
    try {
      if (
        await page
          .locator('button[aria-haspopup="listbox"], button:has-text("Select")')
          .first()
          .isVisible(TIMEOUTS.FIND)
      ) {
        return await page
          .locator('button[aria-haspopup="listbox"], button:has-text("Select")')
          .all();
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  },
  allOptionsLocator: async (locator: Locator, page: Page) =>
    await getAllDropdownOptions(locator, page),
  optionSelect: async (
    page: Page,
    input: { label?: string; locator: Locator },
    selectedOption?: { label?: string; locator?: Locator },
  ) => {
    if (selectedOption?.label) {
      await selectedOption.locator?.click({ delay: 150, ...TIMEOUTS.CLICK });
    }
  },
  getOptionSelected: async (
    page: Page,
    input: { label?: string; locator: Locator },
  ) => {
    const value = await input.locator.textContent();

    return !value || value.includes("Select") ? "" : value;
  },
};

export const radioComponent: IRadioComponent = {
  optionSelect: async (
    page: Page,
    selectedOption: { label: string; locator: Locator },
  ) => {
    let isFilled = false;
    try {
      await selectedOption.locator.first().click(TIMEOUTS.CLICK);
      isFilled = true;
    } catch {}

    return isFilled;
  },
};
