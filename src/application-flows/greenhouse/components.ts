import { Locator, Page } from "@playwright/test";
import { TIMEOUTS } from "../../../config";

const getAllDropdownOptions = async (dropdown: Locator) => {
  const optionsLocators = await dropdown.locator("option").all();
  const options = [];

  for (const optionsLocator of optionsLocators) {
    const label =
      (await optionsLocator.textContent(TIMEOUTS.FIND))?.trim() ?? "";
    options.push({ locator: optionsLocator, label });
  }

  return options;
};

export const dropdownComponent = {
  allLocator: async (page: Page) => await page.locator("select").all(),
  allOptionsLocator: async (locator: Locator) =>
    await getAllDropdownOptions(locator),
  optionSelect: async (
    page: Page,
    input: { label?: string; locator: Locator },
    selectedOption?: { label?: string; locator?: Locator },
  ) => {
    await page.waitForTimeout(30);

    selectedOption?.label &&
      (await input?.locator
        .selectOption({ label: selectedOption.label })
        .catch(async () => {
          console.error(
            "GENERAL_FILL",
            input?.label,
            "Option not found",
            selectedOption.label,
          );
        }));
  },
};
