import { Locator, Page } from '@playwright/test';
import { IDropdownComponent } from '../interfaces';
import { dropdownComponent as defaultDropdownComponent } from '../general/components';
import { TIMEOUTS } from '../../../config';

export const dropdownComponent: IDropdownComponent = {
  ...defaultDropdownComponent,
  optionSelect: async (
    page: Page,
    input: { label?: string; locator: Locator },
    selectedOption?: { label?: string; locator?: Locator }
  ) => {
    await page.waitForTimeout(30);

    const selectButton = input.locator.locator('..').locator('a').first();
    await selectButton.click(TIMEOUTS.CLICK);

    await page
      .locator('.select2-drop-active')
      .getByText(new RegExp(selectedOption?.label as string, 'i'))
      .first()
      .click(TIMEOUTS.CLICK);
  },
  getOptionSelected: async (
    page: Page,
    input: { label?: string; locator: Locator }
  ) => {
    const value = await input.locator
      .locator('..')
      .locator('span[class^="select"][class$="-chosen"]')
      .textContent();
    return !value || value.includes('Select') ? '' : value;
  },
};
