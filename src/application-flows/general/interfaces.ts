import { Locator } from "@playwright/test";
import { INPUT_TYPES } from "../../enums";

export interface IRadioGroup {
  radioLabel: string;
  options: [
    {
      locator: Locator;
      label: string;
      type: typeof INPUT_TYPES.RADIO;
    },
  ];
}

export interface IGeneralFillResponse {
  text: {
    locator: Locator;
    label: string;
    type: "text";
  }[];
  dropdown: Array<
    | {
        locator: Locator;
        label: string;
        type: "dropdown";
        options: {
          locator: Locator;
          label: string;
        }[];
      }
    | IRadioGroup
  >;
  radio: {
    locator: Locator;
    label: string;
    type: typeof INPUT_TYPES.RADIO;
  }[];
  isResumeUploaded: boolean;
}
