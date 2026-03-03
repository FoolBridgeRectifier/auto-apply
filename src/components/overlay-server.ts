import http from 'http';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { Page } from '@playwright/test';
import { generalFill } from '../application-flows/general';
import { textChat } from '../page-loaders/chat-gpt';

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
.row { display: flex; gap: 6px; align-items: center; }
button {
  padding: 5px 10px;
  background: #ffe4e1;
  border: 2px solid #808080;
  border-radius: 6px;
  cursor: pointer;
  font-family: monospace;
  font-weight: 600;
  color: black;
  flex: 1;
  -webkit-app-region: no-drag;
}
button:hover { background: #ffd0cc; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.counter { font-size: 11px; flex: 1; text-align: center; line-height: 1.5; }
textarea {
  width: 100%;
  height: 50px;
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
<div class="row">
  <button id="autofillBtn">Autofill</button>
</div>
<div class="row">
  <div class="counter" id="counter">loading...</div>
</div>
<textarea id="aiInput" placeholder="Paste text for Ask AI..."></textarea>
<button id="askAiBtn">Ask AI</button>
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

  document.getElementById('askAiBtn').addEventListener('click', async () => {
    const text = document.getElementById('aiInput').value.trim();
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

    serverInstance = http.createServer((req, res) => {
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
        if (currentPage) generalFill(currentPage).catch(console.error);
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
