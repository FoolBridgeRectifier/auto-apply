import { Page } from '@playwright/test';

export const selectors = (page: Page) => ({
  get securityCodeInput() {
    return page.getByLabel('Security Code ');
  },
  // input button: <input type="button" value="Submit Application" id="submit_app" class="button">
  get submitApplicationButton() {
    return page.locator('input[type="button"][value="Submit Application"]');
  },
  // extract the alphanumeric code (e.g. Zlro5SYj) from the instruction text
  async extractSecurityCodeFromInstruction(): Promise<string | null> {
    try {
      const text = await page
        .locator(
          'text=Copy and paste this code into the security code field on your application'
        )
        .first()
        .innerText();
      const match = text.match(/application:\s*([A-Za-z0-9]+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },
});
