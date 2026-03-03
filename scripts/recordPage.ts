import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function recordHAR(): Promise<void> {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: npm run record <url>');
    console.error('Example: npm run record https://example.com');
    process.exit(1);
  }

  // Ensure record folder exists at project root
  const recordDir = path.join(process.cwd(), 'record');
  if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
  }

  // Generate timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedUrl = url
    .replace(/https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 50);
  const harPath = path.join(recordDir, `${sanitizedUrl}_${timestamp}.har`);

  console.log(`Recording HAR for: ${url}`);
  console.log(`Saving to: ${harPath}`);

  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    recordHar: {
      path: harPath,
      mode: 'full',
      content: 'embed',
    },
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.warn(`Navigation warning: ${(err as Error).message}`);
  }

  // Wait for user to finish interacting (login, navigate, etc.)
  await new Promise<void>((resolve) => {
    process.stdout.write('\nBrowser is open. Log in or navigate, then press Enter to save the HAR...');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', () => resolve());
  });

  // Save cookies before closing (needed to replay authenticated sessions)
  const cookies = await context.cookies();
  const cookiesPath = harPath.replace('.har', '.cookies.json');
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

  await context.close(); // triggers HAR to be written
  await browser.close();

  console.log(`HAR saved: ${harPath}`);
  console.log(`Cookies saved: ${cookiesPath}`);
}

recordHAR().catch((err: Error) => {
  console.error('Error:', err.message);
  process.exit(1);
});
