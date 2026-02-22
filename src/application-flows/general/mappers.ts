import { FORM_FIELDS } from "../../../config";
import { mockEmail } from "../../mocks";

export const regexMatchers = {
  firstName: /\bfirst\s*name\b/i,
  lastName: /\blast\s*name\b/i,
  fullName: /\bfull\s*name\b/i,
  gender: /\bgender\b/i,
  phone: /^(?!.*\b(?:code|device|type)\b).*?\bphone\b/i,
  phoneType: /(?=.*\bphone\b)(?=.*\b(?:type|device)\b).*$/i,
  phoneCode: /(?=.*\bphone\b)(?=.*\b(?:code)\b).*$/i,
  email: /email|e-mail/i,
  password: /password/i,
  linkedin: /\blinkedin\b/i,
  address: /address|address1|street/i,
  city: /\bcity\b|\bcounty\b/i,
  zip: /zip|post/i,
  state: /state|province|region/i,
  country: /\bcountry\b/i,
  expectedSalary: /expected|salary/i,
  hear: /how did you hear|how did you hear about|hear about|hear|source|referral/i,
  sponsorship:
    /require.*(employment\s*)?sponsorship|sponsorship|require sponsorship|now or in the future/i,
  race: /race|ethnic|ethnicity/i,
  veteran:
    /(?:i\s*am\s*not\s*(?:a\s*)?(?:protected\s*)?veteran)|(?:not\s*(?:a\s*)?(?:protected\s*)?veteran)/i,
  terms:
    /(?:i\s*have\s*read.*(?:terms|privacy))|(?:privacy\s*policy)|(?:consent\s*to\s*the\s*processing)/i,
  raceNotHispanicOrAsian:
    /(?:\basian\b(?!.*hispanic)|not\s*hispanic(?:\s*or\s*latino)?)/i,
};

export const FORM_NAME_CHECK = regexMatchers.firstName; // reused as regex

export const TEXT_MAPPER = [
  {
    matcher: regexMatchers.firstName,
    value: FORM_FIELDS.PERSONAL_DETAILS.FIRST_NAME,
  },
  {
    matcher: regexMatchers.lastName,
    value: FORM_FIELDS.PERSONAL_DETAILS.LAST_NAME,
  },
  {
    matcher: regexMatchers.fullName,
    value: `${FORM_FIELDS.PERSONAL_DETAILS.FIRST_NAME} ${FORM_FIELDS.PERSONAL_DETAILS.LAST_NAME}`,
  },
  { matcher: regexMatchers.gender, value: "male" },
  {
    matcher: regexMatchers.phone,
    value: FORM_FIELDS.PERSONAL_DETAILS.PHONE_NUMBER,
  },
  { matcher: regexMatchers.email, value: mockEmail() },
  {
    matcher: regexMatchers.password,
    value: FORM_FIELDS.PERSONAL_DETAILS.LOGIN.PASSWORD,
  },
  {
    matcher: regexMatchers.linkedin,
    value: FORM_FIELDS.PERSONAL_DETAILS.LINKEDIN,
  },
  // {
  //   matcher: regexMatchers.address,
  //   value: FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.FIRST_LINE,
  // },
  {
    matcher: regexMatchers.city,
    value: FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.CITY,
  },
  {
    matcher: regexMatchers.zip,
    value: FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.ZIP,
  },
  {
    matcher: regexMatchers.state,
    value: FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.STATE,
  },
  {
    matcher: regexMatchers.country,
    value: FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.COUNTRY,
  },
  {
    matcher: regexMatchers.expectedSalary,
    value: FORM_FIELDS.APPLICATION_FIELDS.EXPECTED_SALARY,
  },
  { matcher: regexMatchers.hear, value: "linkedin" },
  { matcher: regexMatchers.sponsorship, value: "yes" },
];

export const DROPDOWN_MAPPER = [
  { matcher: regexMatchers.gender, optionMatcher: /\bmale\b/i },
  {
    matcher: regexMatchers.city,
    optionMatcher: new RegExp(FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.CITY, "i"),
  },
  // {
  //   matcher: regexMatchers.state,
  //   optionMatcher: new RegExp(FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.STATE, "i"),
  // },
  {
    matcher: regexMatchers.country,
    optionMatcher: new RegExp(
      `\b${FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.COUNTRY}\b|United States of America`,
      "i",
    ),
  },
  { matcher: regexMatchers.hear, optionMatcher: /linkedin/i },
  { matcher: regexMatchers.sponsorship, optionMatcher: /yes/i },
  {
    matcher: regexMatchers.race,
    optionMatcher: regexMatchers.raceNotHispanicOrAsian,
  },
];

export const RADIO_CHECKS = [
  { matcher: regexMatchers.veteran },
  { matcher: regexMatchers.terms },
  { matcher: regexMatchers.raceNotHispanicOrAsian },
];
