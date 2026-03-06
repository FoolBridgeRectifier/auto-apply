import http from 'http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { Page } from '@playwright/test';
import { generalFill } from '../application-flows/general';
import { waitForFilled } from '../application-flows/helpers';
import { getLastFillResult } from './fill-state';
import { textChat } from '../page-loaders/chat-gpt';
import { injectSnippets } from './snippets';

interface OverlayState {
  applicationsTotal: number;
  applicationsToday: number;
  applicationsTwoDays: number;
}

let serverInstance: http.Server | null = null;
let currentPage: Page | null = null;

const state: OverlayState = {
  applicationsTotal: 0,
  applicationsToday: 0,
  applicationsTwoDays: 0,
};

export const setOverlayPage = (page: Page) => {
  currentPage = page;
  injectSnippets(page).catch(console.error);
};

export const incrementOverlayCounts = () => {
  state.applicationsTotal++;
  state.applicationsToday++;
  state.applicationsTwoDays++;
};

const OVERLAY_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Auto-Apply Overlay</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23ff6b6b'/><text x='16' y='23' font-size='19' font-family='monospace' font-weight='bold' text-anchor='middle' fill='white'>A</text></svg>">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #ffe4e1;
  font-family: monospace;
  font-weight: 600;
  color: black;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  overflow: hidden;
  -webkit-app-region: drag;
  user-select: none;
}
.counter { font-size: 11px; text-align: center; line-height: 1.5; }
.main-row { display: flex; gap: 6px; flex: 1; min-height: 0; }
.col-left { display: flex; flex-direction: column; gap: 6px; width: 80px; }
.col-right { display: flex; flex-direction: column; gap: 6px; flex: 1; }
button {
  padding: 5px 10px;
  background: #ffe4e1;
  border: 2px solid #808080;
  border-radius: 6px;
  cursor: pointer;
  font-family: monospace;
  font-weight: 600;
  color: black;
  -webkit-app-region: no-drag;
}
.col-left button { flex: 1; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
#autofillBtn { background: #fde8d0; }
#autofillBtn:hover { background: #fbd8b8; }
#submitBtn { background: #d6ecd6; }
#submitBtn:hover { background: #c2dfc2; }
#askAiBtn { background: #d6e4ec; }
#askAiBtn:hover { background: #c0d4e0; }
textarea {
  flex: 1;
  width: 100%;
  resize: none;
  font-family: monospace;
  font-size: 11px;
  border: 2px solid #808080;
  border-radius: 6px;
  padding: 4px;
  background: #fff8f7;
  -webkit-app-region: no-drag;
  user-select: text;
}
</style>
</head>
<body>
<div class="counter" id="counter">loading...</div>
<div class="main-row">
  <div class="col-left">
    <button id="autofillBtn">Autofill</button>
    <button id="submitBtn">Submit</button>
  </div>
  <div class="col-right">
    <textarea id="aiInput" placeholder="Paste text for Ask AI..."></textarea>
    <button id="askAiBtn">Ask AI</button>
  </div>
</div>
<script>
  async function fetchState() {
    try {
      const r = await fetch('/state');
      const s = await r.json();
      document.getElementById('counter').textContent =
        'total: ' + s.applicationsTotal + ' | today: ' + s.applicationsToday + ' | 2d: ' + s.applicationsTwoDays;
    } catch {}
  }

  document.getElementById('autofillBtn').addEventListener('click', async () => {
    const btn = document.getElementById('autofillBtn');
    btn.textContent = '...';
    btn.disabled = true;
    try {
      await fetch('/autofill', { method: 'POST' });
    } finally {
      btn.textContent = 'Autofill';
      btn.disabled = false;
    }
  });

  document.getElementById('submitBtn').addEventListener('click', async () => {
    const btn = document.getElementById('submitBtn');
    btn.textContent = '...';
    btn.disabled = true;
    try {
      await fetch('/submit', { method: 'POST' });
    } finally {
      btn.textContent = 'Submit';
      btn.disabled = false;
    }
  });

  document.getElementById('askAiBtn').addEventListener('click', async () => {
    const input = document.getElementById('aiInput');
    let text = input.value.trim();
    if (!text) {
      try {
        const r = await fetch('/get-selection');
        const s = await r.json();
        if (s.text) {
          input.value = s.text;
          text = s.text;
        }
      } catch {}
    }
    if (!text) return;
    const btn = document.getElementById('askAiBtn');
    btn.textContent = '...';
    btn.disabled = true;
    try {
      const r = await fetch('/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const s = await r.json();
      if (s.response) {
        await navigator.clipboard.writeText(s.response);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Ask AI'; btn.disabled = false; }, 2000);
        return;
      }
    } catch {}
    btn.textContent = 'Ask AI';
    btn.disabled = false;
  });

  fetchState();
  setInterval(fetchState, 2000);

  async function pollSelection() {
    try {
      const r = await fetch('/get-selection');
      const s = await r.json();
      if (s.text) {
        const input = document.getElementById('aiInput');
        if (input.value !== s.text) input.value = s.text;
      }
    } catch {}
  }
  setInterval(pollSelection, 500);
</script>
</body>
</html>`;

export const startOverlayServer = (
  initialState: OverlayState
): Promise<number> =>
  new Promise((resolve) => {
    if (serverInstance) {
      resolve((serverInstance.address() as { port: number }).port);
      return;
    }

    Object.assign(state, initialState);

    serverInstance = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/state' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
        return;
      }

      if (req.url === '/autofill' && req.method === 'POST') {
        res.writeHead(200);
        res.end('{}');
        if (currentPage) {
          generalFill(currentPage).catch(console.error);
        }
        return;
      }

      if (req.url === '/submit' && req.method === 'POST') {
        res.writeHead(200);
        res.end('{}');
        if (currentPage) {
          (async () => {
            try {
              const fillResult = getLastFillResult();
              if (fillResult) {
                await waitForFilled(currentPage!, fillResult);
              }
              const submitBtn = await findSubmitButton(currentPage!);
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
        if (currentPage) {
          try {
            const selected = await currentPage.evaluate(() => window.getSelection()?.toString() ?? '');
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

    serverInstance.listen(0, '127.0.0.1', () => {
      resolve((serverInstance!.address() as { port: number }).port);
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

  const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinAPI {
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
'@
$procs = Get-Process -Name chrome,chromium,msedge -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  if ($p.MainWindowTitle -like '*Auto-Apply Overlay*') {
    [WinAPI]::SetWindowPos($p.MainWindowHandle, [IntPtr]::new(-1), 0, 0, 0, 0, 3)
  }
}
`;

  const tmpPath = path.join(os.tmpdir(), 'auto-apply-topmost.ps1');
  setTimeout(() => {
    try {
      fs.writeFileSync(tmpPath, psScript);
      exec(`powershell -ExecutionPolicy Bypass -File "${tmpPath}"`, (err) => {
        if (err) console.error('[Overlay] always-on-top failed:', err.message);
      });
    } catch (err) {
      console.error(
        '[Overlay] always-on-top setup failed:',
        (err as Error).message
      );
    }
  }, 3000);
};
