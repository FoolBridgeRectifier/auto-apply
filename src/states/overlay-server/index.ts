import http from 'http';
import type { Page } from 'playwright';

export interface OverlayState {
  applicationsTotal: number;
  applicationsToday: number;
  applicationsTwoDays: number;
}

let serverInstance: http.Server | null = null;
export const getServerInstance = () => serverInstance;
export const setServerInstance = (s: http.Server | null) => {
  serverInstance = s;
};

let currentPage: Page | null = null;
export const getCurrentPage = () => currentPage;
export const setCurrentPage = (p: Page) => {
  currentPage = p;
};

export const overlayState: OverlayState = {
  applicationsTotal: 0,
  applicationsToday: 0,
  applicationsTwoDays: 0,
};
