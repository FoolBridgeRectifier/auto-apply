import path from 'path';
import formFields from '../assets/form-fields.json';
import snippets from '../assets/shortcuts.js';

export const isMocked = ''; // "workday";

export const OLLAMA_MODEL = 'qwen3:8b';

export const TIMEOUTS = {
  DEFAULT: 0,
  CLICK: { timeout: 300 },
  FIND: { timeout: 500 },
  PAGE_START_SHORT: { timeout: 1500 },
  PAGE_START: { timeout: 3500 },
  EXTENDED_TIME: { timeout: 8000 },
};

export const FORM_FIELDS = {
  ...formFields,
  PERSONAL_DETAILS: {
    ...formFields.PERSONAL_DETAILS,
    RESUME: path.join(__dirname, '..', formFields.PERSONAL_DETAILS.RESUME),
    EXPERIENCES: path.join(__dirname, '..', formFields.PERSONAL_DETAILS.EXPERIENCES),
  },
};

export const SNIPPETS: Record<string, string> = snippets;
