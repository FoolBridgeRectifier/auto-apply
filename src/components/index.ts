import { Page, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { syncFile } from './helpers';
import {
  startOverlayServer,
  setOverlayPage,
  incrementOverlayCounts,
  setWindowAlwaysOnTop,
} from './overlay-server';

const syncedData = syncFile();
let applicationsTotal = syncedData.applicationsTotal;
let applicationsToday = syncedData.applicationsToday;
let applicationsTwoDays = syncedData.applicationsTwoDays;

export const incrementApplications = () => {
  syncedData.incrementApplications();
  applicationsTotal += 1;
  applicationsToday += 1;
  applicationsTwoDays += 1;
  incrementOverlayCounts();
};

let _overlayLaunched = false;
let _overlayPid: number | undefined;
const trackedContexts = new Set<BrowserContext>();

export const closeOverlay = () => {
  if (_overlayPid === undefined) return;
  const pid = _overlayPid;
  _overlayPid = undefined;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/F', '/PID', String(pid), '/T'], {
        stdio: 'ignore',
      });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch {}
};

process.once('exit', closeOverlay);

const trackContext = (context: BrowserContext) => {
  if (trackedContexts.has(context)) return;
  trackedContexts.add(context);
  // Any new page or popup in this context becomes the current target
  context.on('page', (page) => setOverlayPage(page));
};

export const autofillButton = async (page: Page) => {
  // Set the initial page, then let context events take over for new pages/popups
  setOverlayPage(page);
  trackContext(page.context());

  const port = await startOverlayServer({
    applicationsTotal,
    applicationsToday,
    applicationsTwoDays,
  });

  if (!_overlayLaunched) {
    _overlayLaunched = true;
    const windowWidth = 320;
    const screen = getPrimaryScreenSize();
    const posX = screen.width - windowWidth - 10;
    const cp = spawn(
      getChromePath(),
      [
        `--app=http://127.0.0.1:${port}`,
        `--window-size=${windowWidth},240`,
        `--window-position=${posX},10`,
        `--user-data-dir=${path.join(os.tmpdir(), 'auto-apply-overlay')}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
      { detached: true, stdio: 'ignore' }
    );
    _overlayPid = cp.pid;
    cp.unref();
    setWindowAlwaysOnTop();
  }
};

const getPrimaryScreenSize = (): { width: number; height: number } => {
  if (process.platform === 'win32') {
    try {
      const result = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          'Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Write-Output "$($s.Width) $($s.Height)"',
        ],
        { encoding: 'utf8' }
      );
      const parts = result.stdout.trim().split(' ').map(Number);
      if (parts.length === 2 && parts[0]! > 0 && parts[1]! > 0) {
        return { width: parts[0]!, height: parts[1]! };
      }
    } catch {}
  }
  return { width: 1920, height: 1080 };
};

const getChromePath = (): string => {
  const candidates = [
    process.env['PROGRAMFILES'] &&
      path.join(
        process.env['PROGRAMFILES'],
        'Google\\Chrome\\Application\\chrome.exe'
      ),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(
        process.env['PROGRAMFILES(X86)'],
        'Google\\Chrome\\Application\\chrome.exe'
      ),
    process.env['LOCALAPPDATA'] &&
      path.join(
        process.env['LOCALAPPDATA'],
        'Google\\Chrome\\Application\\chrome.exe'
      ),
  ].filter(Boolean) as string[];

  return candidates.find((p) => fs.existsSync(p)) ?? chromium.executablePath();
};
