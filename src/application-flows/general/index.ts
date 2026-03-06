import { Page } from '@playwright/test';
import {
  filterAlNums,
  getBestFieldMatch,
  getDropdownInputs,
  getRadioInputs,
  getResumeInput,
  getTextInputs,
} from './helpers';
import { DROPDOWN_MAPPER, RADIO_CHECKS, TEXT_MAPPER } from './mappers';
import { INPUT_TYPES } from '../../enums';
import { FORM_FIELDS, TIMEOUTS } from '../../../config';
import { dropdownComponent, radioComponent } from './components';
import { IDropdownComponent, IRadioComponent } from '../interfaces';
import { syncSavedAnswers } from '../helpers';
import { IGeneralFillResponse } from './interfaces';
import { openChatGpt } from '../../page-loaders';
import { setLastFillResult } from '../../components/fill-state';

const savedAnswersState = syncSavedAnswers();

export async function generalFill(
  page: Page,
  skips: {
    resume?: boolean;
    resumeFileChooser?: boolean;
    resumeFileSetter?: boolean;
    text?: boolean;
    dropdown?: boolean;
    radio?: boolean;
  } = {},
  components: {
    dropdownComponent?: IDropdownComponent;
    radioComponent?: IRadioComponent;
  } = { dropdownComponent, radioComponent }
): Promise<IGeneralFillResponse> {
  const missedRequiredTexts = [];
  const missedRequiredDropdown = [];
  const missedRequiredRadios = [];

  let resumeError = null;

  // resume — handled once, not in the loop
  if (!skips.resume) {
    try {
      const resumeField = await getResumeInput(page);
      resumeError =
        (resumeField.locator || resumeField.linkLocator) && 'Not Found';
      if (resumeField.linkLocator && !skips.resumeFileChooser) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', TIMEOUTS.CLICK),
          resumeField.linkLocator.click(TIMEOUTS.CLICK),
        ]);
        try {
          await fileChooser.setFiles(
            FORM_FIELDS.PERSONAL_DETAILS.RESUME,
            TIMEOUTS.CLICK
          );
        } catch {}
      }
      if (resumeField.locator && !skips.resumeFileSetter) {
        await resumeField.locator.setInputFiles(
          FORM_FIELDS.PERSONAL_DETAILS.RESUME,
          TIMEOUTS.CLICK
        );
      }
      await page.waitForLoadState('networkidle', TIMEOUTS.PAGE_START);
    } catch (e) {
      console.error('SET_RESUME_ERROR');
      resumeError = e;
    }
  }

  // text fields — loop until no new inputs appear
  const visitedText = new Set<string>();
  let nameUsed = false;

  if (!skips.text) {
    while (true) {
      const textFields = await getTextInputs(page);
      const newText = textFields.filter((f) => !visitedText.has(f.label));

      if (!newText.length) break;

      for (const field of newText) {
        visitedText.add(field.label);

        let formValue = getBestFieldMatch(
          [
            ...savedAnswersState.getSavedAnswers(field.label, INPUT_TYPES.TEXT),
            ...TEXT_MAPPER,
          ],
          field.label
        ) as string | undefined;

        try {
          if (!formValue) {
            formValue = await openChatGpt(INPUT_TYPES.TEXT, field.label);
            missedRequiredTexts.push(field);
          }
          if (formValue) {
            await field.locator.clear(TIMEOUTS.CLICK);
            await field.locator.fill(formValue, TIMEOUTS.CLICK);
          } else {
            missedRequiredTexts.push(field);
          }

          // when only full name
          if (!nameUsed && field.label.includes('name')) {
            await field.locator.clear(TIMEOUTS.CLICK);
            await field.locator.fill(
              `${FORM_FIELDS.PERSONAL_DETAILS.FIRST_NAME} ${FORM_FIELDS.PERSONAL_DETAILS.LAST_NAME}`,
              TIMEOUTS.CLICK
            );
            nameUsed = true;
          }
        } catch {
          console.error('TEXT_NOT_FILLED', field.label);
          missedRequiredTexts.push(field);
        }
      }
    }
  }

  // dropdown fields — loop until no new inputs appear
  const visitedDropdown = new Set<string>();

  if (!skips.dropdown) {
    while (true) {
      const dropdownFields = await getDropdownInputs(page, components);
      const newDropdown = dropdownFields.filter(
        (f) => !visitedDropdown.has(f.label)
      );

      if (!newDropdown.length) break;

      const field = newDropdown[0];
      visitedDropdown.add(field.label);
      let isFilled = false;
      const options = await (
        components.dropdownComponent as IDropdownComponent
      ).allOptionsLocator(field.locator, page);

      let formValue: RegExp | string | undefined = getBestFieldMatch(
        [
          ...savedAnswersState.getSavedAnswers(
            field.label,
            INPUT_TYPES.DROPDOWN
          ),
          ...DROPDOWN_MAPPER,
        ],
        field.label,
        options
      ) as RegExp | undefined;
      try {
        if (!formValue) {
          formValue = await openChatGpt(
            INPUT_TYPES.DROPDOWN,
            field.label,
            options.map(({ label }) => label).join(', ')
          );
          missedRequiredDropdown.push({ ...field, options });
        }
        if (formValue) {
          const chosenOption = options.find(({ label }) =>
            (typeof formValue === 'string'
              ? new RegExp(formValue)
              : formValue
            )?.test(filterAlNums(label))
          );

          if (chosenOption) {
            await (
              components.dropdownComponent as IDropdownComponent
            ).optionSelect(page, field, chosenOption);
            isFilled = true;
          }
        }

        if (!isFilled) {
          console.error('DROPDOWN_NOT_FILLED', field.label);
          missedRequiredDropdown.push({ ...field, options });
        }
      } catch {
        console.error('DROPDOWN_NOT_FILLED_ERROR', field.label);
        missedRequiredDropdown.push({ ...field, options });
      }
    }
  }

  // radio fields — loop until no new inputs appear
  const visitedRadio = new Set<string>();

  if (!skips.radio) {
    while (true) {
      const radioFields = await getRadioInputs(page);
      const newRadio = radioFields.filter(
        (g) => !visitedRadio.has(g.radioLabel)
      );

      if (!newRadio.length) break;

      for (const radioGroup of newRadio) {
        visitedRadio.add(radioGroup.radioLabel);
        try {
          if (!radioGroup.radioLabel) {
            for (const field of radioGroup.options) {
              const formValue = [
                ...savedAnswersState.getSavedAnswers(
                  field.label,
                  INPUT_TYPES.RADIO
                ),
                ...RADIO_CHECKS,
              ].some(({ matcher }) => matcher.test(filterAlNums(field.label)));

              let isFilled = false;
              if (formValue) {
                isFilled = await (
                  components.radioComponent as IRadioComponent
                ).optionSelect(page, field);
              }

              if (!isFilled) {
                console.error('RADIO_NOT_FILLED_SEPARATE', field);
                missedRequiredRadios.push(field);
              }
            }
          } else {
            // for values grouped
            let isFilled = false;
            const options = radioGroup.options;
            const formValue: RegExp | undefined = getBestFieldMatch(
              [
                ...savedAnswersState.getSavedAnswers(
                  radioGroup.radioLabel,
                  INPUT_TYPES.DROPDOWN
                ),
                ...DROPDOWN_MAPPER,
              ],
              radioGroup.radioLabel,
              options
            ) as RegExp | undefined;

            if (formValue) {
              const chosenOption = options.find(({ label }) =>
                formValue?.test(filterAlNums(label))
              );

              if (chosenOption) {
                // need wait so it fills
                isFilled = await (
                  components.radioComponent as IRadioComponent
                ).optionSelect(page, chosenOption);
              }
            }

            if (!isFilled && radioGroup.radioLabel.includes('*')) {
              console.error('RADIO_NOT_FILLED_GROUPED', radioGroup.radioLabel);
              missedRequiredDropdown.push(radioGroup);
            }
          }
        } catch (e) {
          console.error('RADIO_NOT_FILLED_ERROR', radioGroup.radioLabel, e);
        }
      }
    }
  }

  const result: IGeneralFillResponse = {
    [INPUT_TYPES.TEXT]: missedRequiredTexts,
    [INPUT_TYPES.DROPDOWN]: missedRequiredDropdown,
    [INPUT_TYPES.RADIO]: missedRequiredRadios,
    isResumeUploaded: !resumeError,
  };
  setLastFillResult(result);
  return result;
}
