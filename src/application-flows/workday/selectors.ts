import { Page } from "@playwright/test";
import { FORM_FIELDS, TIMEOUTS } from "../../../config";

const getInitialPageCallback = () => {
  if (document.documentElement?.textContent.includes("Verify New Password")) {
    return "SIGNUP";
  } else if (document.documentElement?.textContent.includes("Email Address")) {
    return "LOGIN";
  } else if (document.documentElement?.textContent.includes("Drop file here")) {
    return "RESUME";
  }
  return false;
};

export const selectors = (page: Page) => ({
  get autoFillWithResumeButton() {
    return page.getByText("Autofill with Resume");
  },
  get loginCreateAccountButton() {
    return page
      .locator(
        '[aria-label="Create Account"], [data-automation-id="noCaptchaWrapper"]',
      )
      .last();
  },
  get getInitialPage() {
    return page.waitForFunction(getInitialPageCallback);
  },
  get termsCheckbox() {
    return page
      .getByLabel("Yes, I have read and consent to the terms and conditions.")
      .first();
  },
  get personalPage() {
    return page.getByRole("heading", { level: 2, name: /My Information/i });
  },
  get resumeUploaded() {
    return page.waitForFunction(() => {
      return document.documentElement?.textContent.includes(
        "Successfully Uploaded!",
      );
    });
  },
  get referralInput() {
    const label = page
      .locator("label", { hasText: "How Did You Hear About Us?" })
      .first();
    return label
      .locator("xpath=..")
      .locator('input, textarea, [role="textbox"], [placeholder="Search"]')
      .first();
  },
  get referralSelect1() {
    return page.getByText("Other").first();
  },
  get referralSelect2() {
    return page.getByText("Other - Other");
  },
  get personalDetailsStateSelect() {
    return page.getByText(FORM_FIELDS.PERSONAL_DETAILS.ADDRESS.STATE).first();
  },
  get experiencePage() {
    return page.getByRole("heading", { level: 2, name: /My Experience/i });
  },
  get extraQuestionsPage() {
    return page.getByRole("heading", {
      level: 2,
      name: /Application Questions/i,
    });
  },
  get disclosurePage() {
    return page.getByRole("heading", {
      level: 2,
      name: /Voluntary Disclosures/i,
    });
  },
  get identityPage() {
    return page.getByRole("heading", { level: 2, name: /Self Identify/i });
  },
  get addEducationButton() {
    return page
      .getByRole("heading", { level: 3, name: /Education/i })
      .locator("..")
      .getByRole("button", { name: /^\s*Add\s*$/i })
      .locator("..");
  },
  get addSchoolInput() {
    return page.getByRole("textbox", { name: "School or University" });
  },
  get skillsTextClick() {
    return page
      .getByRole("heading", { level: 3, name: /Skills/i })
      .locator("..")
      .locator('[data-automation-id="multiSelectContainer"]')
      .first();
  },
  get skillsTextInput() {
    return page
      .getByRole("heading", { level: 3, name: /Skills/i })
      .locator("..")
      .locator("input")
      .first();
  },
  get applicationPage() {
    return page.waitForFunction(() => {
      return document.documentElement?.textContent.includes(
        "Application Questions",
      );
    });
  },
  get applicationH1bSponsorButton() {
    return page.getByRole("group", { name: "Are you legally authorized to" });
  },
  get applicationH1bSponsorSelect() {
    return page.getByText("Yes");
  },
  get continueButton() {
    return page
      .getByRole("button", { name: new RegExp("Continue", "i") })
      .last();
  },
});
