import { Page } from "@playwright/test";
import { APPLICATION_FLOWS } from "./enums";
import { FORM_FIELDS, isMocked } from "../config";

export const jobRightApplicationMock = async (
  page: Page,
  type: string | null = isMocked,
) => {
  await page.waitForTimeout(3000);

  switch (type) {
    case APPLICATION_FLOWS.ASHBY:
      await page.goto("https://jobright.ai/jobs/info/6984152a0f6f7e7a2cde3ce3");
      break;
    case APPLICATION_FLOWS.HIREBRIDGE:
      await page.goto("https://jobright.ai/jobs/info/6933af78a0dde7020e2f087f");
      break;
    case APPLICATION_FLOWS.WORKDAY:
      await page.goto("https://jobright.ai/jobs/info/698630170f6f7e7a2ce11133");
      break;
    case APPLICATION_FLOWS.LEVER:
      await page.goto("https://jobright.ai/jobs/info/6971763a587dfa0bb55f293f");
      break;
    case "icims":
      await page.goto("https://jobright.ai/jobs/info/68cefab0846f0b04af67e283");
      break;
    case APPLICATION_FLOWS.GREENHOUSE:
      await page.goto("https://jobright.ai/jobs/info/68fc4798f55bb021a88a2355");
      break;
    case "singlePage":
      await page.goto("https://jobright.ai/jobs/info/696e85e4350cf43803153c8c");
      break;
    default:
      return;
  }
};

export const applicationPageMock = async (
  page: Page,
  type: string | null = isMocked,
) => {
  await page.waitForTimeout(3000);

  switch (type) {
    case APPLICATION_FLOWS.ASHBY:
      await page.goto(
        "https://jobs.ashbyhq.com/scribd/0924b5bf-47f7-4e8c-b291-4840ae1a6250/application?utm_source=JbD88A8ZW7&jr_id=6984152a0f6f7e7a2cde3ce3",
      );
      break;
    case APPLICATION_FLOWS.WORKDAY:
      await page.goto(
        "https://relx.wd3.myworkdayjobs.com/elsevierjobs/job/Philadelphia-PA/Middle-Tier-Software-Engineer-III_R107624-1?jr_id=698630170f6f7e7a2ce11133",
      );
      break;
    case APPLICATION_FLOWS.LEVER:
      await page.goto(
        "https://jobs.lever.co/attentive/ae2d6837-ce43-4b31-8c86-d014bb0c7e9d",
      );
      break;
    case "icims":
      await page.goto(
        "https://careers-sidley.icims.com/jobs/10610/ai-systems-analyst/job",
      );
      break;
    case APPLICATION_FLOWS.GREENHOUSE:
      await page.goto(
        "https://boards.greenhouse.io/embed/job_app?token=5687321004&utm_source=jobright&jr_id=68fc4798f55bb021a88a2355",
      );
      break;
    case "singlePage":
      await page.goto(
        "https://zealogicsllc.applytojob.com/apply/job_20250807194245_2VR9WJE4O32ORTG5",
      );
      break;
    default:
      return;
  }
};

export const mockEmail = (isEmailMocked: boolean = Boolean(isMocked)) =>
  isEmailMocked
    ? "sathy.sunder" + "+" + Math.random() + "@gmail.com"
    : FORM_FIELDS.PERSONAL_DETAILS.EMAIL;
