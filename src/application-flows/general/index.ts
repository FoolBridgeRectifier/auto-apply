import { Locator, Page } from "@playwright/test";
import { filterAlNums, getRequiredInputs } from "./helpers";
import {
  DROPDOWN_MAPPER,
  FORM_NAME_CHECK,
  RADIO_CHECKS,
  TEXT_MAPPER,
} from "./mappers";
import { INPUT_TYPES } from "../../enums";
import { FORM_FIELDS, TIMEOUTS } from "../../../config";
import { dropdownComponent, radioComponent } from "./components";
import { IDropdownComponent, IRadioComponent } from "../interfaces";
import { syncSavedAnswers } from "../helpers";
import { IGeneralFillResponse } from "./interfaces";

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
  } = { dropdownComponent, radioComponent },
): Promise<IGeneralFillResponse> {
  const {
    [INPUT_TYPES.TEXT]: textFields,
    [INPUT_TYPES.DROPDOWN]: dropdownFields,
    [INPUT_TYPES.RADIO]: radioFields,
    [INPUT_TYPES.FILE]: resumeField,
  } = await getRequiredInputs(page, components);

  const missedRequiredTexts = [];
  const missedRequiredDropdown = [];
  const missedRequiredRadios = [];

  let resumeError = null;
  // resume
  if (resumeField && !skips.resume) {
    try {
      if (resumeField.linkLocator && !skips.resumeFileChooser) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser", TIMEOUTS.PAGE_START), // Wait for the new page to open
          resumeField.linkLocator.click(TIMEOUTS.CLICK), // Click the apply button
        ]);
        try {
          await fileChooser.setFiles(
            FORM_FIELDS.PERSONAL_DETAILS.RESUME,
            TIMEOUTS.CLICK,
          );
        } catch {}
      }
      if (resumeField.locator && !skips.resumeFileSetter) {
        await resumeField.locator.setInputFiles(
          FORM_FIELDS.PERSONAL_DETAILS.RESUME,
          TIMEOUTS.CLICK,
        );
      }
      await page.waitForLoadState("networkidle", TIMEOUTS.PAGE_START);
    } catch (e) {
      console.error("SET_RESUME_ERROR");
      resumeError = e;
    }
  }
  // text fields
  if (!skips.text) {
    let nameUsed = false;
    for (const field of textFields) {
      nameUsed = FORM_NAME_CHECK.test(field.label);

      const formValue =
        savedAnswersState.getSavedAnswer(field.label, INPUT_TYPES.TEXT) ??
        TEXT_MAPPER.find(({ matcher }) =>
          matcher.test(filterAlNums(field.label)),
        );

      try {
        if (formValue) {
          await field.locator.clear(TIMEOUTS.CLICK);
          await field.locator.fill(formValue.value, TIMEOUTS.CLICK);
        } else {
          missedRequiredTexts.push(field);
        }

        // when only full name
        if (!nameUsed && field.label.includes("name")) {
          await field.locator.clear(TIMEOUTS.CLICK);
          await field.locator.fill(
            `${FORM_FIELDS.PERSONAL_DETAILS.FIRST_NAME} ${FORM_FIELDS.PERSONAL_DETAILS.LAST_NAME}`,
            TIMEOUTS.CLICK,
          );
          nameUsed = true;
        }
      } catch {
        console.error("TEXT_NOT_FILLED", field.label);
        missedRequiredTexts.push(field);
      }
    }
  }

  // dropdown fields
  if (!skips.dropdown) {
    for (const field of dropdownFields) {
      const formValue =
        DROPDOWN_MAPPER.find(({ matcher }) =>
          matcher.test(filterAlNums(field.label)),
        ) ??
        savedAnswersState.getSavedAnswer(field.label, INPUT_TYPES.DROPDOWN);

      let isFilled = false;
      const options = await (
        components.dropdownComponent as IDropdownComponent
      ).allOptionsLocator(field.locator, page);

      try {
        if (formValue) {
          const chosenOption = options.find(({ label }) =>
            formValue?.optionMatcher?.test(filterAlNums(label)),
          );

          if (chosenOption) {
            // need wait so it fills
            await (
              components.dropdownComponent as IDropdownComponent
            ).optionSelect(page, field, chosenOption);
            isFilled = true;
          }
        }

        if (!isFilled) {
          console.error("DROPDOWN_NOT_FILLED", field.label);
          missedRequiredDropdown.push({ ...field, options });
        }
      } catch {
        console.error("DROPDOWN_NOT_FILLED_ERROR", field.label);
        missedRequiredDropdown.push({ ...field, options });
      }
    }
  }

  // radio fields
  if (!skips.radio) {
    for (const radioGroup of radioFields) {
      try {
        if (!radioGroup.radioLabel) {
          for (const field of radioGroup.options) {
            // If not radio group detected
            const formValue =
              savedAnswersState.getSavedAnswer(
                field.label,
                INPUT_TYPES.RADIO,
              ) ??
              RADIO_CHECKS.some(({ matcher }) =>
                matcher.test(filterAlNums(field.label)),
              );

            let isFilled = false;
            if (formValue) {
              isFilled = await (
                components.radioComponent as IRadioComponent
              ).optionSelect(page, field);
            }

            if (!isFilled) {
              console.error("RADIO_NOT_FILLED_SEPARATE", field);
              missedRequiredRadios.push(field);
            }
          }
        } else {
          // for values grouped
          let isFilled = false;
          const formValue =
            savedAnswersState.getSavedAnswer(
              radioGroup.radioLabel,
              INPUT_TYPES.DROPDOWN,
            ) ??
            DROPDOWN_MAPPER.find(({ matcher }) =>
              matcher.test(filterAlNums(radioGroup.radioLabel)),
            );

          if (formValue) {
            const options = radioGroup.options;
            const chosenOption = options.find(({ label }) =>
              formValue?.optionMatcher?.test(filterAlNums(label)),
            );

            if (chosenOption) {
              // need wait so it fills
              isFilled = await (
                components.radioComponent as IRadioComponent
              ).optionSelect(page, chosenOption);
            }
          }

          if (!isFilled && radioGroup.radioLabel.includes("*")) {
            console.error("RADIO_NOT_FILLED_GROUPED", radioGroup.radioLabel);
            missedRequiredDropdown.push(radioGroup);
          }
        }
      } catch (e) {
        console.error("RADIO_NOT_FILLED_ERROR", radioGroup.radioLabel, e);
      }
    }
  }

  return {
    [INPUT_TYPES.TEXT]: missedRequiredTexts,
    [INPUT_TYPES.DROPDOWN]: missedRequiredDropdown,
    [INPUT_TYPES.RADIO]: missedRequiredRadios,
    isResumeUploaded: Boolean(!resumeError && resumeField),
  };
}
