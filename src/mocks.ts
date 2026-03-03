import { Page, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { APPLICATION_FLOWS } from './enums';
import { FORM_FIELDS, isMocked } from '../config';

const HAR_URL_PATTERNS: Record<string, string> = {
  [APPLICATION_FLOWS.ASHBY]: APPLICATION_FLOWS.ASHBY,
  [APPLICATION_FLOWS.HIREBRIDGE]: APPLICATION_FLOWS.HIREBRIDGE,
  [APPLICATION_FLOWS.WORKDAY]: 'workdayjobs',
  [APPLICATION_FLOWS.GREENHOUSE]: APPLICATION_FLOWS.GREENHOUSE,
  [APPLICATION_FLOWS.LEVER]: APPLICATION_FLOWS.LEVER,
  [APPLICATION_FLOWS.ICIMS]: APPLICATION_FLOWS.ICIMS,
  singlePage: 'applytojob',
};

// Maps shorthand isMocked values to full APPLICATION_FLOWS keys
const TYPE_ALIASES: Record<string, string> = {
  ashby: APPLICATION_FLOWS.ASHBY,
  workday: APPLICATION_FLOWS.WORKDAY,
  greenhouse: APPLICATION_FLOWS.GREENHOUSE,
  lever: APPLICATION_FLOWS.LEVER,
  hirebridge: APPLICATION_FLOWS.HIREBRIDGE,
};

const normalizeType = (type: string | null): string | null =>
  type ? (TYPE_ALIASES[type] ?? type) : null;

const findLatestHar = (type: string | null): string | null => {
  return findAllHars(type)[0] ?? null;
};

const findAllHars = (type: string | null): string[] => {
  if (!type) return [];
  const recordDir = path.join(process.cwd(), 'record');
  if (!fs.existsSync(recordDir)) return [];

  // Check direct name match first: e.g. record/ashby.har for type 'ashby'
  const directPath = path.join(recordDir, `${type}.har`);
  if (fs.existsSync(directPath)) return [directPath];

  // Fall back to URL pattern search in timestamped files
  const normalized = normalizeType(type);
  const pattern = normalized ? HAR_URL_PATTERNS[normalized] : null;
  if (!pattern) return [];
  return fs
    .readdirSync(recordDir)
    .filter((f) => f.endsWith('.har') && f.includes(pattern))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(recordDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .map((f) => path.join(recordDir, f.name));
};

// Returns [personalInfoHar, remainingPagesHar] for workday by looking up
// explicitly named files first, falling back to mtime sort.
const findWorkdayHars = (): [string, string | undefined] => {
  const recordDir = path.join(process.cwd(), 'record');
  const personalInfoPath = path.join(recordDir, 'workdayjobs_personal_info.har');
  const remainingPagesPath = path.join(recordDir, 'workdayjobs_remaining_pages.har');
  if (fs.existsSync(personalInfoPath) && fs.existsSync(remainingPagesPath)) {
    return [personalInfoPath, remainingPagesPath];
  }
  const all = findAllHars(APPLICATION_FLOWS.WORKDAY);
  return [all[0], all[1]];
};

export const jobRightApplicationMock = async (
  page: Page,
  type: string | null = isMocked
) => {
  await page.waitForTimeout(3000);

  switch (type) {
    case APPLICATION_FLOWS.ASHBY:
      await page.goto('https://jobright.ai/jobs/info/6984152a0f6f7e7a2cde3ce3');
      break;
    case APPLICATION_FLOWS.HIREBRIDGE:
      await page.goto('https://jobright.ai/jobs/info/6933af78a0dde7020e2f087f');
      break;
    case APPLICATION_FLOWS.WORKDAY:
      await page.goto('https://jobright.ai/jobs/info/698630170f6f7e7a2ce11133');
      break;
    case APPLICATION_FLOWS.LEVER:
      await page.goto('https://jobright.ai/jobs/info/6971763a587dfa0bb55f293f');
      break;
    case APPLICATION_FLOWS.ICIMS:
      await page.goto('https://jobright.ai/jobs/info/68cefab0846f0b04af67e283');
      break;
    case APPLICATION_FLOWS.GREENHOUSE:
      await page.goto('https://jobright.ai/jobs/info/68fc4798f55bb021a88a2355');
      break;
    case 'singlePage':
      await page.goto('https://jobright.ai/jobs/info/696e85e4350cf43803153c8c');
      break;
    default:
      return;
  }
};

export const applicationPageMock = async (
  page: Page,
  type: string | null = isMocked
) => {
  await page.waitForTimeout(3000);

  switch (type) {
    case APPLICATION_FLOWS.ASHBY:
      await page.goto(
        'https://jobs.ashbyhq.com/scribd/0924b5bf-47f7-4e8c-b291-4840ae1a6250/application?utm_source=JbD88A8ZW7&jr_id=6984152a0f6f7e7a2cde3ce3'
      );
      break;
    case APPLICATION_FLOWS.WORKDAY:
      await page.goto(
        'https://relx.wd3.myworkdayjobs.com/elsevierjobs/job/Philadelphia-PA/Middle-Tier-Software-Engineer-III_R107624-1?jr_id=698630170f6f7e7a2ce11133'
      );
      break;
    case APPLICATION_FLOWS.LEVER:
      await page.goto(
        'https://jobs.lever.co/basis/618a912e-c0be-4467-adbf-add2445575a9/apply?source=LinkedIn&jr_id=693889d4b95c305f206dba31'
      );
      break;
    case APPLICATION_FLOWS.ICIMS:
      await page.goto(
        'https://careers-nafinc.icims.com/jobs/7610/software-development-engineer-iii/job?rb=LINKEDIN&mode=job&iis=Job+Board&iisn=LinkedIn&jr_id=69a1abc80da45516f16b0d98&mobile=false&width=1140&height=500&bga=true&needsRedirect=false&jan1offset=-360&jun1offset=-300'
      );
      break;
    case APPLICATION_FLOWS.GREENHOUSE:
      await page.goto(
        'https://boards.greenhouse.io/embed/job_app?token=5687321004&utm_source=jobright&jr_id=68fc4798f55bb021a88a2355'
      );
      break;
    case 'singlePage':
      await page.goto(
        'https://zealogicsllc.applytojob.com/apply/job_20250807194245_2VR9WJE4O32ORTG5'
      );
      break;
    default:
      return;
  }
};

export const mockEmail = (isEmailMocked: boolean = Boolean(isMocked)) =>
  isEmailMocked
    ? `sathy.sunder+${Math.random()}@gmail.com`
    : FORM_FIELDS.PERSONAL_DETAILS.EMAIL;

const injectCookiesFromHar = async (
  context: BrowserContext,
  harPath: string
) => {
  const cookiesPath = harPath.replace('.har', '.cookies.json');
  if (!fs.existsSync(cookiesPath)) return;
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  if (cookies.length) {
    await context.addCookies(cookies);
    console.log(`Injected ${cookies.length} cookies from ${cookiesPath}`);
  }
};

const getFirstDocumentUrl = (harPath: string): string | null => {
  const fd = fs.openSync(harPath, 'r');
  const buffer = Buffer.alloc(500_000);
  const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  const text = buffer.subarray(0, bytesRead).toString('utf8');
  const entriesIdx = text.indexOf('"entries"');
  if (entriesIdx === -1) return null;
  const slice = text.slice(entriesIdx);
  const m =
    slice.match(
      /"_resourceType"\s*:\s*"document"[\s\S]{0,1000}?"url"\s*:\s*"(https?:\/\/[^"]+)"/
    ) ??
    slice.match(
      /"url"\s*:\s*"(https?:\/\/[^"]+)"[\s\S]{0,1000}?"_resourceType"\s*:\s*"document"/
    ) ??
    slice.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
  return m?.[1] ?? null;
};

interface HarMocks {
  graphqlResponse: string;
  workdayIndex: Map<
    string,
    { body: string; headers: Record<string, string>; status: number }
  >;
  icimsUrl: string | null;
  icimsIndex: Map<
    string,
    { body: string; headers: Record<string, string>; status: number }
  >;
}

// Jobapplication paths embed a per-session ID: strip it to just the endpoint name.
// All other Workday paths are indexed by pathname (query params ignored).
const normalizeWorkdayKey = (url: string): string => {
  const { pathname } = new URL(url);
  // Old format: /wday/calypso/cxs/jobapplication/relx/.../<endpoint>
  // New format: /wday/cxs/relx/.../<endpoint>
  if (pathname.includes('/cxs/jobapplication/') || pathname.includes('/wday/cxs/'))
    return pathname.split('/').pop() ?? pathname;
  return pathname;
};

// Headers that must be stripped — Playwright re-calculates them and passing
// them through causes decoding / framing errors.
const STRIP_HEADERS = new Set([
  'content-encoding',
  'transfer-encoding',
  'content-length',
]);

// iCIMS JS strips in_iframe=1 from the URL when the page loads outside an iframe.
// Normalize by removing it so we can match either form.
const stripInIframe = (url: string): string =>
  url
    .replace(/([?&])in_iframe=\d+(&?)/, (_, sep, amp) => (amp ? sep : ''))
    .replace(/[?&]$/, '');

const buildHarMocks = (harPath: string): HarMocks => {
  const har = JSON.parse(fs.readFileSync(harPath, 'utf8'));
  const mergedData: Record<string, unknown> = {};
  const workdayIndex = new Map<
    string,
    { body: string; headers: Record<string, string>; status: number }
  >();
  const icimsIndex = new Map<
    string,
    { body: string; headers: Record<string, string>; status: number }
  >();
  let icimsUrl: string | null = null;

  for (const entry of har?.log?.entries ?? []) {
    const url: string = entry.request?.url ?? '';

    // Extract iCIMS candidate URL before body guard — we only need URL + status.
    // Must be a GET; the POST submissions cannot be navigated to via page.goto.
    if (
      url.includes('icims.com') &&
      url.includes('/candidate') &&
      entry.request?.method === 'GET' &&
      (entry._resourceType === 'document' ||
        entry.response?.content?.mimeType?.includes('text/html')) &&
      (entry.response?.status ?? 0) === 200
    ) {
      icimsUrl = url;
    }

    const content = entry.response?.content ?? {};
    const rawBody: string = content.text ?? '';
    const body =
      content.encoding === 'base64'
        ? Buffer.from(rawBody, 'base64').toString('utf8')
        : rawBody;
    if (!body) continue;

    if (url.includes('non-user-graphql')) {
      try {
        const parsed = JSON.parse(body);
        if (parsed?.data) Object.assign(mergedData, parsed.data);
      } catch {
        /* skip */
      }
    } else if (url.includes('myworkdayjobs.com')) {
      const key = normalizeWorkdayKey(url);
      if (key) {
        const status = entry.response?.status ?? 200;
        // Prefer 2xx responses: overwrite non-2xx entries so post-login data wins
        if (!workdayIndex.has(key) || (status >= 200 && status < 300)) {
          const headers: Record<string, string> = {};
          for (const h of entry.response?.headers ?? []) {
            const name = h.name.toLowerCase();
            if (!STRIP_HEADERS.has(name)) headers[name] = h.value;
          }
          workdayIndex.set(key, { body, headers, status });
        }
      }
    } else if (url.includes('icims.com') && url.includes('/candidate')) {
      // Index by URL with in_iframe stripped so requests made outside an
      // iframe context (where iCIMS JS removes in_iframe=1) still match.
      const status = entry.response?.status ?? 200;
      const key = stripInIframe(url);
      if (!icimsIndex.has(key) || (status >= 200 && status < 300)) {
        const headers: Record<string, string> = {};
        for (const h of entry.response?.headers ?? []) {
          const name = h.name.toLowerCase();
          if (!STRIP_HEADERS.has(name)) headers[name] = h.value;
        }
        icimsIndex.set(key, { body, headers, status });
      }
    }
  }

  return {
    graphqlResponse: JSON.stringify({ data: mergedData }),
    workdayIndex,
    icimsUrl,
    icimsIndex,
  };
};

export const applicationPageHarMock = async (
  page: Page,
  type: string | null = isMocked,
  harPath?: string,
  options?: { icimsUrl?: string }
) => {
  const resolvedHarPath = harPath ?? findLatestHar(type);
  if (resolvedHarPath) {
    // For Workday, use explicitly named HARs: personal_info covers up to
    // personal information, remaining_pages covers the rest.
    const [personalInfoHar, remainingPagesHar] =
      !harPath && type === APPLICATION_FLOWS.WORKDAY
        ? findWorkdayHars()
        : [resolvedHarPath, undefined];

    const url = getFirstDocumentUrl(personalInfoHar);
    await injectCookiesFromHar(page.context(), personalInfoHar);
    page.on('requestfailed', (req) =>
      console.log(
        '[HAR ABORT]',
        req.method(),
        req.url(),
        req.failure()?.errorText
      )
    );

    // Register remainingPagesHar first (lower priority) so personalInfoHar takes
    // precedence for early pages; remainingPagesHar fills in later pages not
    // captured in personalInfoHar.
    if (remainingPagesHar) {
      console.log(`Using remaining pages HAR: ${remainingPagesHar}`);
      await page.routeFromHAR(remainingPagesHar, { notFound: 'fallback' });
    }
    await page.routeFromHAR(personalInfoHar, {
      notFound: remainingPagesHar ? 'fallback' : 'abort',
    });

    if (type === APPLICATION_FLOWS.GREENHOUSE) {
      await page.route('**Jobs-css**', (route) =>
        route.fulfill({ status: 404, body: '' })
      );
    }

    // Build mocks: keep both indices separate so the route handler can switch
    // between them at the validate PUT boundary.
    const personalInfoMocks = buildHarMocks(personalInfoHar);
    const personalInfoIndex = personalInfoMocks.workdayIndex;
    let { graphqlResponse, icimsUrl, icimsIndex } = personalInfoMocks;
    let remainingPagesIndex: typeof personalInfoIndex | null = null;
    if (remainingPagesHar) {
      const remainingPagesMocks = buildHarMocks(remainingPagesHar);
      remainingPagesIndex = remainingPagesMocks.workdayIndex;
      const mergedGraphqlData = {
        ...JSON.parse(remainingPagesMocks.graphqlResponse).data,
        ...JSON.parse(personalInfoMocks.graphqlResponse).data,
      };
      graphqlResponse = JSON.stringify({ data: mergedGraphqlData });
      icimsUrl = personalInfoMocks.icimsUrl ?? remainingPagesMocks.icimsUrl;
      icimsIndex =
        personalInfoMocks.icimsIndex.size > 0
          ? personalInfoMocks.icimsIndex
          : remainingPagesMocks.icimsIndex;
    }

    // iCIMS: intercept any navigation to the login page and redirect straight
    // to the candidate form, bypassing session checks and hcaptcha.
    if (type === APPLICATION_FLOWS.ICIMS && (options?.icimsUrl ?? icimsUrl)) {
      const targetUrl = options?.icimsUrl ?? icimsUrl;
      await page.route('**icims.com**/login**', (route) =>
        route.fulfill({
          status: 302,
          headers: { location: targetUrl as string },
        })
      );
    }

    // iCIMS: serve candidate requests matched by URL with in_iframe=1 stripped.
    // The page JS removes in_iframe=1 when not in an iframe context, producing
    // a URL that routeFromHAR can't match. We look it up in icimsIndex instead.
    if (type === APPLICATION_FLOWS.ICIMS && icimsIndex.size > 0) {
      await page.route('**icims.com**/candidate**', async (route) => {
        const key = stripInIframe(route.request().url());
        const cached = icimsIndex.get(key);
        if (!cached) {
          await route.fallback();
          return;
        }
        await route.fulfill({
          status: cached.status,
          headers: cached.headers,
          body: cached.body,
        });
      });
    }

    await page.route('**/api/non-user-graphql**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: graphqlResponse,
      });
    });

    // Workday: match all myworkdayjobs.com requests by normalized key
    // (strips session ID from jobapplication paths, ignores query params everywhere).
    // When two HARs are in use, requests before the first validate PUT are served
    // from personalInfoIndex; from that PUT onward, remainingPagesIndex takes
    // priority (falling back to personalInfoIndex for any missing keys).
    if (personalInfoIndex.size > 0 || (remainingPagesIndex?.size ?? 0) > 0) {
      let useRemainingPagesHar = false;
      let workExperiencesCallCount = 0;
      await page.route('**myworkdayjobs.com**', async (route) => {
        const key = normalizeWorkdayKey(route.request().url());

        // Let routeFromHAR handle document (page navigation) requests so the browser
        // gets the actual HTML from the HAR instead of our JSON mock data.
        if (route.request().resourceType() === 'document') {
          await route.fallback();
          return;
        }

        // Register: Workday returns JSON {widget:'redirect',url,externalSpa} not HTTP 303.
        // The JS reads the body and navigates client-side to the url field.
        if (key.endsWith('/register') && route.request().method() === 'POST') {
          const postData = route.request().postData() ?? '{}';
          let successUri: string;
          try {
            successUri = JSON.parse(postData)?.successRedirectUri ?? '/';
          } catch {
            successUri =
              new URLSearchParams(postData).get('successRedirectUri') ?? '/';
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              widget: 'redirect',
              url: successUri,
              externalSpa: true,
            }),
          });
          return;
        }

        // Switch to remainingPagesHar starting from the first validate PUT
        // (end of personal information page).
        if (key === 'validate' && route.request().method() === 'PUT') {
          useRemainingPagesHar = true;
        }

        const primary = useRemainingPagesHar
          ? (remainingPagesIndex ?? personalInfoIndex)
          : personalInfoIndex;
        const fallback = useRemainingPagesHar ? personalInfoIndex : remainingPagesIndex;
        const cached = primary.get(key) ?? fallback?.get(key);
        if (!cached) console.log('[HAR MISS]', route.request().method(), key);

        // The recorded workexperiences schema has endDate.hidden=true because
        // the session had "currentlyWorkHere" checked. The first entry is the
        // current job so endDate stays hidden; for all subsequent entries patch
        // it to false so the field is visible.
        let body = cached?.body ?? '{}';
        if (key === 'workexperiences') {
          const callIndex = workExperiencesCallCount++;
          if (callIndex > 0) {
            try {
              const schema = JSON.parse(body);
              const props = schema?.definitions?.workExperience?.properties;
              if (props?.endDate) props.endDate.hidden = false;
              body = JSON.stringify(schema);
            } catch { /* leave body as-is if unparseable */ }
          }
        }

        // definition?type=primary is a POST whose request body contains the
        // current answers. Use the sponsorship question answer to decide whether
        // to show the follow-up "describe sponsorship" field.
        if (key.includes('questionnaire') && key.endsWith('/definition')) {
          try {
            const schema = JSON.parse(body);
            const props = schema?.definitions?.primaryQuestionnaire?.properties;
            const sponsorshipDetail = props?.['1b72f70184a9100154d213eec5ef0000'];
            if (sponsorshipDetail) {
              const requestAnswers = JSON.parse(route.request().postData() ?? '{}');
              const sponsorshipAnswer = requestAnswers['61b7a768c89d10015478ffd3ea4b0000'];
              sponsorshipDetail.hidden = sponsorshipAnswer?.descriptor !== 'Yes';
              body = JSON.stringify(schema);
            }
          } catch { /* leave body as-is if unparseable */ }
        }

        await route.fulfill({
          status: cached?.status ?? 200,
          headers: cached?.headers ?? { 'content-type': 'application/json' },
          body,
        });
      });
    }

    const navUrl =
      type === APPLICATION_FLOWS.ICIMS
        ? (options?.icimsUrl ?? icimsUrl ?? url)
        : url;
    if (navUrl) {
      console.log(`Using HAR: ${resolvedHarPath}`);
      await page.waitForTimeout(3000);
      await page.goto(navUrl, { waitUntil: 'domcontentloaded' });
      return;
    }
  }
  await applicationPageMock(page, normalizeType(type));
};
