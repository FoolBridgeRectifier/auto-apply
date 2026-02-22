import path from "path";
import fs from "fs";
import { IDropdownComponent, ISavedAnswers } from "./interfaces";
import { filterAlNums } from "./general/helpers";
import { IGeneralFillResponse } from "./general/interfaces";
import { Locator, Page } from "@playwright/test";
import { INPUT_TYPES } from "../enums";
import { dropdownComponent as defaultDropdownComponent } from "./general/components";

declare global {
  interface Window {
    saveOnContinue: () => Promise<void>;
  }
}

const defaultData: ISavedAnswers = {
  text: { include: [], exclude: [] },
  dropdown: { include: [], exclude: [] },
  radio: { include: [], exclude: [] },
};

const dataPath = path.join(__dirname, "../../data/savedAnswers.json");

let data: ISavedAnswers = { ...defaultData };

const loadFromDisk = () => {
  try {
    const fileContent = fs.readFileSync(dataPath, "utf-8");
    data = JSON.parse(fileContent);
  } catch {
    data = { ...defaultData };
  }
};

const writeToDisk = () => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("syncSavedAnswers: write failed", err);
  }
};

loadFromDisk();

const savedAnswersState = {
  getSavedAnswer: (label: string, type: "text" | "dropdown" | "radio") => {
    if (
      data[type].exclude.some((excludeLabel) =>
        new RegExp(filterAlNums(excludeLabel), "i").test(filterAlNums(label)),
      )
    ) {
      return;
    }

    const formValue = data[type].include.find(({ label: includeLabel }) =>
      new RegExp(filterAlNums(includeLabel), "i").test(filterAlNums(label)),
    );

    return formValue
      ? {
          matcher: new RegExp(filterAlNums(formValue.label), "i"),
          value: formValue.value,
          optionMatcher: new RegExp(filterAlNums(formValue.value), "i"),
        }
      : undefined;
  },

  setSavedAnswer: (
    answerToSave: { label: string; value: string },
    type: "text" | "dropdown" | "radio",
  ) => {
    data[type].include.push(answerToSave);
    writeToDisk();
  },

  reload: () => {
    loadFromDisk();
  },

  getData: (): ISavedAnswers => {
    return data;
  },
};

// export function that always returns the same state (singleton)
export const syncSavedAnswers = () => savedAnswersState;

// Check all inputs for filled values
export const waitForFilled = async (
  page: Page,
  missedFields: IGeneralFillResponse,
  dropdownComponent: IDropdownComponent = defaultDropdownComponent,
) => {
  for (const field of missedFields.dropdown) {
    try {
      if ("type" in field) {
        savedAnswersState.setSavedAnswer(
          {
            label: field.label,
            value: await dropdownComponent.getOptionSelected(page, field),
          },
          INPUT_TYPES.DROPDOWN,
        );
      } else {
        const options = [];
        for (const option of field.options) {
          options.push({
            label: option.label,
            el: await option.locator.first().elementHandle(),
          });
        }
        const value = await page.evaluate((optionEls) => {
          return optionEls.find(({ el }) => (el as HTMLInputElement).checked);
        }, options);

        savedAnswersState.setSavedAnswer(
          {
            label: field.radioLabel,
            value: value?.label || "",
          },
          INPUT_TYPES.DROPDOWN,
        );
      }
    } catch {
      console.error("Cannot save Field", field);
    }
  }

  for (const field of missedFields.radio) {
    try {
      if (
        await field.locator.evaluate((el) => (el as HTMLInputElement).checked)
      ) {
        savedAnswersState.setSavedAnswer(
          {
            label: field.label,
            value: "",
          },
          INPUT_TYPES.RADIO,
        );
      }
    } catch {
      console.error("Cannot save Field", field);
    }
  }

  for (const field of missedFields.text) {
    try {
      const value = (await (
        await page.waitForFunction(
          (el) => {
            return el && (el as HTMLInputElement).value;
          },
          await field.locator.elementHandle(),
        )
      ).jsonValue()) as string;
      savedAnswersState.setSavedAnswer(
        { label: field.label, value },
        INPUT_TYPES.TEXT,
      );
    } catch {
      console.error("Cannot save Field", field);
    }
  }
};

// Bind button onclick
export const bindSaveToButton = async (
  functionText: string = "saveOnContinue",
  page: Page,
  button: Locator,
  missedFields: IGeneralFillResponse,
  dropdownComponent: IDropdownComponent,
) => {
  await page.exposeFunction(functionText, async () => {
    await waitForFilled(page, missedFields, dropdownComponent);
  });

  await button.evaluate((el, functionText) => {
    let isDataSaved = false; // Flag to prevent recursion

    el?.addEventListener(
      "click",
      async (event) => {
        // 1. Kill the current event path
        event.preventDefault();
        event.stopImmediatePropagation();

        // 2. Run your custom logic
        const win = window as typeof window & {
          [key: string]: () => Promise<void>;
        };

        if (win[functionText]) {
          await win[functionText]();
        }

        // 3. Manually re-trigger the click to let "super" events fire
        isDataSaved = true;
        (el as HTMLButtonElement).click();
      },
      {
        once: true,
        capture: true,
      },
    );
  }, functionText);
};
