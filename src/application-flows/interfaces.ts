import { Locator, Page } from '@playwright/test';
import { INPUT_TYPES } from '../enums';

export interface IDropdownComponent {
  allLocator: (page: Page) => Promise<Locator[]>;
  allOptionsLocator: (
    locator: Locator,
    page: Page
  ) => Promise<
    {
      locator: Locator;
      label: string;
    }[]
  >;
  optionSelect: (
    page: Page,
    input: {
      label?: string;
      locator: Locator;
    },
    selectedOption?: {
      label?: string;
      locator?: Locator;
    }
  ) => Promise<void>;
  getOptionSelected: (
    page: Page,
    input: {
      label?: string;
      locator: Locator;
    }
  ) => Promise<string>;
}

export interface IRadioComponent {
  optionSelect: (
    page: Page,
    selectedOption: {
      label: string;
      locator: Locator;
    }
  ) => Promise<boolean>;
}

type TSavedAnswerArray = {
  include: Array<{
    label: string;
    value: string;
  }>;
  exclude: Array<string>;
};

export interface ISavedAnswers {
  [INPUT_TYPES.TEXT]: TSavedAnswerArray;
  [INPUT_TYPES.DROPDOWN]: TSavedAnswerArray;
  [INPUT_TYPES.RADIO]: TSavedAnswerArray;
}
