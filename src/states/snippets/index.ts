import type { Page } from 'playwright';

const injectedPages = new WeakSet<Page>();

export const hasInjectedPage = (page: Page) => injectedPages.has(page);
export const addInjectedPage = (page: Page) => injectedPages.add(page);
