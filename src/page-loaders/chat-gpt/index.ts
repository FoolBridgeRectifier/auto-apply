import { FORM_FIELDS } from '../../../config';
import ollama from 'ollama';
import mammoth from 'mammoth';
import { INPUT_TYPES } from '../../enums';

let resumeText: string = '';
let experienceText: string = '';

export const loadResumeText = async () => {
  const { value: resumeValue } = await mammoth.extractRawText({
    path: FORM_FIELDS.PERSONAL_DETAILS.RESUME,
  });
  const { value: experienceValue } = await mammoth.extractRawText({
    path: FORM_FIELDS.PERSONAL_DETAILS.EXPERIENCES,
  });

  resumeText = resumeValue;
  experienceText = experienceValue;
};

const radioChat = async (label: string) => {
  const response = await ollama.chat({
    model: 'qwen3:0.6b',
    messages: [
      {
        role: 'system',
        content:
          'You are an HR assistant. Answer only with "Yes" or "No" based strictly on the provided text. No explanation.',
      },
      {
        role: 'user',
        content: `RESUME CONTENT:\n${resumeText}\n\nEXPERIENCE: ${experienceText}\n\nQUESTION: ${label}`,
      },
    ],
    options: {
      temperature: 0, // Forces deterministic, "best-guess" output
      num_predict: 2, // Limits the model to generating only ~2 tokens
    },
  });

  return response.message.content.trim();
};

const optionsChat = async (label: string, options?: string) => {
  const response = await ollama.chat({
    model: 'qwen3:0.6b',
    messages: [
      {
        role: 'system',
        content: `You are a data extractor. You must only answer with exactly one of the following options: [${options}]. Do not provide any other text.`,
      },
      {
        role: 'user',
        content: `RESUME CONTENT:\n${resumeText}\n\nEXPERIENCE: ${experienceText}\n\nQUESTION: ${label}`,
      },
    ],
    options: {
      temperature: 0,
    },
  });

  return response.message.content.trim();
};

const textChat = async (label: string) => {
  const response = await ollama.chat({
    model: 'qwen3:0.6b',
    messages: [
      {
        role: 'user',
        content: `RESUME CONTENT:\n${resumeText}\n\nEXPERIENCE: ${experienceText}\n\nQUESTION: ${label}\n\nInstruction: Use only simple common words. Do not use hyphens or complex terms. Avoid all punctuation possible. Give a very short answer.`,
      },
    ],
    options: {
      temperature: 0,
    },
  });

  return response.message.content.trim();
};

export const openChatGpt = async (
  type: (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES],
  label: string,
  options?: string
) => {
  switch (type) {
    case INPUT_TYPES.TEXT:
      return await textChat(label);
    case INPUT_TYPES.DROPDOWN:
      return await optionsChat(label, options);
    case INPUT_TYPES.RADIO:
      return await radioChat(label);
    default:
      return await textChat(label);
  }
};
