import { Locator, Page } from '@playwright/test';
import { resumeInputTypes } from './constants';
import { INPUT_TYPES } from '../../enums';
import { TIMEOUTS } from '../../../config';
import { dropdownComponent } from './components';
import { IDropdownComponent } from '../interfaces';
import { IRadioGroup } from './interfaces';

const getAfterContent = async (locator: Locator) => {
  return locator.evaluate((el) => {
    return window.getComputedStyle(el, '::after').content;
  });
};

const getLabel = async (page: Page, locator: Locator, isRadio?: boolean) => {
  const id = await locator.getAttribute('id', TIMEOUTS.FIND);

  const adjacentLabelLocator = page.locator(`label[for="${id}"]`);
  const parentLabelLocator = locator.locator('xpath=ancestor::label[1]');
  const fieldsetTitleLocator = locator.locator(
    'xpath=(ancestor::fieldset[1]//legend | ancestor::fieldset[1]//label)[1]'
  );

  let adjacentLabelText = '';
  try {
    if (await adjacentLabelLocator.isVisible(TIMEOUTS.FIND)) {
      adjacentLabelText =
        (await adjacentLabelLocator.first().textContent()) ?? '';
    }
  } catch {}

  let parentLabelText = '';
  try {
    if (await parentLabelLocator.isVisible(TIMEOUTS.FIND)) {
      parentLabelText = (await parentLabelLocator.first().textContent()) ?? '';
    }
  } catch {}

  let fieldsetTitleText = '';
  try {
    if (await fieldsetTitleLocator.isVisible(TIMEOUTS.FIND)) {
      fieldsetTitleText =
        (await fieldsetTitleLocator.first().textContent()) ?? '';
    }
  } catch {}

  let adjacentLabelAfter = '';
  try {
    if (await adjacentLabelLocator.isVisible(TIMEOUTS.FIND)) {
      adjacentLabelAfter =
        (await getAfterContent(adjacentLabelLocator.first())) ?? '';
    }
  } catch {}

  let parentLabelAfter = '';
  try {
    if (await parentLabelLocator.isVisible(TIMEOUTS.FIND)) {
      parentLabelAfter =
        (await getAfterContent(parentLabelLocator.first())) ?? '';
    }
  } catch {}

  let fieldsetTitleAfter = '';
  try {
    if (await fieldsetTitleLocator.isVisible(TIMEOUTS.FIND)) {
      fieldsetTitleAfter =
        (await getAfterContent(fieldsetTitleLocator.first())) ?? '';
    }
  } catch {}

  const fieldsetText = fieldsetTitleText + fieldsetTitleAfter;
  const labelText = (
    adjacentLabelText + adjacentLabelAfter ||
    parentLabelText + parentLabelAfter ||
    (!isRadio ? fieldsetText : '')
  )
    .trim()
    .toLowerCase()
    .replace('none', '');

  return {
    labelText,
    radioLabel: fieldsetText.trim().toLowerCase().replace('none', ''),
  };
};

export const getRequiredInputs = async (
  page: Page,
  components: {
    dropdownComponent?: IDropdownComponent;
  } = { dropdownComponent }
) => {
  // for text inputs
  let requiredTextLocators = [];
  let textInputLocators: Locator[] = [];
  try {
    if (await page.getByRole('textbox').first().isVisible(TIMEOUTS.FIND)) {
      textInputLocators = await page.getByRole('textbox').all();
    }
  } catch {
    console.error('NO_TEXT_INPUTS');
  }

  for (const textInputLocator of textInputLocators) {
    const { labelText } = await getLabel(page, textInputLocator);

    if (
      labelText &&
      !labelText.includes('resume') &&
      (labelText.includes('*') || /required/i.test(labelText))
    ) {
      requiredTextLocators.push({
        locator: textInputLocator,
        label: labelText,
        type: INPUT_TYPES.TEXT,
      });
    }
  }

  // for dropdowns
  const requiredDropdownLocators = [];
  const dropdownLocators = await (
    components?.dropdownComponent as IDropdownComponent
  ).allLocator(page);

  for (const dropdownLocator of dropdownLocators) {
    const { labelText } = await getLabel(page, dropdownLocator);

    if (labelText && (labelText.includes('*') || /required/i.test(labelText))) {
      requiredDropdownLocators.push({
        locator: dropdownLocator,
        label: labelText,
        type: INPUT_TYPES.DROPDOWN,
      });
    }
  }
  const dropdownLabels = requiredDropdownLocators.map(
    (requiredDropdownLocator) => requiredDropdownLocator.label
  );
  requiredTextLocators = requiredTextLocators.filter(
    ({ label }) => !dropdownLabels.includes(label)
  );

  // for radios
  const formattedRadioLocators: Array<IRadioGroup> = [];
  let radioLocators: Locator[] = [];
  try {
    if (
      (await page.getByRole('radio').first().isVisible(TIMEOUTS.FIND)) ||
      (await page.getByRole('checkbox').first().isVisible(TIMEOUTS.FIND))
    ) {
      radioLocators = [
        ...(await page.getByRole('radio').all()),
        ...(await page.getByRole('checkbox').all()),
      ];
    }
  } catch {
    console.error('NO_RADIO_INPUTS');
  }

  for (const radioLocator of radioLocators) {
    const { labelText, radioLabel } = await getLabel(page, radioLocator, true);

    const isPresentRadioLocator = formattedRadioLocators.find(
      ({ radioLabel: formattedRadioLocatorLabel }) =>
        formattedRadioLocatorLabel === radioLabel
    );
    if (isPresentRadioLocator) {
      isPresentRadioLocator.options.push({
        locator: radioLocator,
        label: labelText,
        type: INPUT_TYPES.RADIO,
      });
    } else {
      formattedRadioLocators.push({
        radioLabel,
        options: [
          {
            locator: radioLocator,
            label: labelText,
            type: INPUT_TYPES.RADIO,
          },
        ],
      });
    }
  }

  // for resume
  const resumeLinkLocator = page
    .locator('button, a')
    .filter({
      hasText: new RegExp(resumeInputTypes.join('|'), 'i'),
      ...TIMEOUTS.FIND,
    })
    .first();
  const resumeLink = resumeLinkLocator || null;

  // for resume
  let resumeFileLocator = null;
  const fileLocators = await page.locator('input[type="file"]').all();

  for (const fileLocator of fileLocators) {
    const { labelText } = await getLabel(page, fileLocator);

    const attrsString = (
      (await fileLocator.evaluate((el) =>
        Array.from(el.attributes)
          .map((a) => `${a.name} ${a.value}`)
          .join(' ')
      )) ?? ''
    ).toLowerCase();

    if (labelText?.includes('resume') || attrsString.includes('resume')) {
      resumeFileLocator = { locator: fileLocator, label: labelText };
    }
  }

  return {
    [INPUT_TYPES.TEXT]: requiredTextLocators,
    [INPUT_TYPES.DROPDOWN]: requiredDropdownLocators,
    [INPUT_TYPES.RADIO]: formattedRadioLocators,
    [INPUT_TYPES.FILE]: {
      linkLocator: resumeLink,
      locator: resumeFileLocator?.locator,
      label: resumeFileLocator?.label,
      type: INPUT_TYPES.FILE,
    },
  };
};

export const filterAlNums = (str: string) =>
  (str ?? '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toLowerCase();
