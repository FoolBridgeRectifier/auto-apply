import http from 'http';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import type { Page } from 'playwright';
import { generalFill } from '../application-flows/general';
import { waitForFilled } from '../application-flows/helpers';
import { getLastFillResult } from '../states/fill';
import { textChat } from '../page-loaders/chat-gpt';
import { injectSnippets } from './snippets';
import {
  type OverlayState,
  getServerInstance,
  setServerInstance,
  getCurrentPage,
  setCurrentPage,
  overlayState,
} from '../states/overlay-server';

const ASSETS = path.join(__dirname, 'overlay');
const OVERLAY_HTML = fs.readFileSync(path.join(ASSETS, 'overlay.html'), 'utf8');
const OVERLAY_CSS = fs.readFileSync(path.join(ASSETS, 'overlay.css'), 'utf8');
const OVERLAY_JS = fs.readFileSync(path.join(ASSETS, 'overlay.js'), 'utf8');

export const setOverlayPage = (page: Page) => {
  setCurrentPage(page);
  injectSnippets(page).catch(console.error);
};

export const incrementOverlayCounts = () => {
  overlayState.applicationsTotal++;
  overlayState.applicationsToday++;
  overlayState.applicationsTwoDays++;
};

export const startOverlayServer = (
  initialState: OverlayState
): Promise<number> =>
  new Promise((resolve) => {
    const existing = getServerInstance();
    if (existing) {
      resolve((existing.address() as { port: number }).port);
      return;
    }

    Object.assign(overlayState, initialState);

    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/overlay.css' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(OVERLAY_CSS);
        return;
      }

      if (req.url === '/overlay.js' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(OVERLAY_JS);
        return;
      }

      if (req.url === '/state' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(overlayState));
        return;
      }

      if (req.url === '/autofill' && req.method === 'POST') {
        res.writeHead(200);
        res.end('{}');
        const page = getCurrentPage();
        if (page) {
          generalFill(page).catch(console.error);
        }
        return;
      }

      if (req.url === '/submit' && req.method === 'POST') {
        res.writeHead(200);
        res.end('{}');
        const page = getCurrentPage();
        if (page) {
          (async () => {
            try {
              const fillResult = getLastFillResult();
              if (fillResult) {
                await waitForFilled(page, fillResult);
              }
              const submitBtn = await findSubmitButton(page);
              if (submitBtn) await submitBtn.click();
            } catch (err) {
              console.error('[Overlay] submit failed:', err);
            }
          })();
        }
        return;
      }

      if (req.url === '/get-selection' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const page = getCurrentPage();
        if (page) {
          try {
            const selected = await page.evaluate(
              () => window.getSelection()?.toString() ?? ''
            );
            res.end(JSON.stringify({ text: selected }));
          } catch {
            res.end(JSON.stringify({ text: '' }));
          }
        } else {
          res.end(JSON.stringify({ text: '' }));
        }
        return;
      }

      if (req.url === '/ask-ai' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { text } = JSON.parse(body);
            const response = await textChat(text);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ response }));
          } catch {
            res.writeHead(500);
            res.end('{}');
          }
        });
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(OVERLAY_HTML);
    });

    setServerInstance(server);

    server.listen(0, '127.0.0.1', () => {
      resolve((getServerInstance()!.address() as { port: number }).port);
    });
  });

const findSubmitButton = async (page: Page) => {
  const selectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    'button:has-text("Apply Now")',
    'button:has-text("Next")',
    'button:has-text("Continue")',
  ];
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0) return loc;
  }
  return null;
};

export const setWindowAlwaysOnTop = () => {
  if (process.platform !== 'win32') return;

  const psPath = path.join(ASSETS, 'topmost.ps1');
  setTimeout(() => {
    exec(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, (err) => {
      if (err) console.error('[Overlay] always-on-top failed:', err.message);
    });
  }, 3000);
};
