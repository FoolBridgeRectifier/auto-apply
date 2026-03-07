import type { BrowserContext } from 'playwright';

let overlayLaunched = false;
export const isOverlayLaunched = () => overlayLaunched;
export const setOverlayLaunched = () => {
  overlayLaunched = true;
};

let overlayPid: number | undefined;
export const getOverlayPid = () => overlayPid;
export const setOverlayPid = (pid: number | undefined) => {
  overlayPid = pid;
};

const trackedContexts = new Set<BrowserContext>();
export const hasTrackedContext = (ctx: BrowserContext) =>
  trackedContexts.has(ctx);
export const addTrackedContext = (ctx: BrowserContext) =>
  trackedContexts.add(ctx);
