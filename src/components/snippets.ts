import type { Page } from 'playwright';
import { SNIPPETS } from '../../config';
import { hasInjectedPage, addInjectedPage } from '../states/snippets';

// This function runs in the browser — edit it as normal JS, it's serialized via toString()
function snippetKeydownScript(snippets: Record<string, string>) {
  const w = window as Window & { __snippetsInjected?: boolean };
  if (w.__snippetsInjected) return;
  w.__snippetsInjected = true;
  document.addEventListener('keydown', function(e) {
    if (e.key !== ' ' && e.key !== 'Tab' && e.key !== 'Enter') return;
    const el = document.activeElement as HTMLInputElement | null;
    if (!el) return;
    const tag = el.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    if (el.type === 'password') return;
    const value = el.value;
    const cursor = el.selectionStart;
    if (typeof cursor !== 'number') return;
    const textBefore = value.slice(0, cursor);
    const match = textBefore.match(/(\S+)$/);
    if (!match) return;
    const word = match[1];
    if (!snippets[word]) return;
    e.preventDefault();
    const expansion = snippets[word];
    const before = value.slice(0, cursor - word.length);
    const after = value.slice(cursor);
    const newValue = before + expansion + after;
    const proto = tag === 'TEXTAREA'
      ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
      : Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (proto && proto.set) proto.set.call(el, newValue);
    else el.value = newValue;
    const newCursor = before.length + expansion.length;
    el.setSelectionRange(newCursor, newCursor);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: expansion }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);
}

const buildScript = (snippets: Record<string, string>): string =>
  `(${snippetKeydownScript.toString()})(${JSON.stringify(snippets)})`;

export const injectSnippets = async (page: Page): Promise<void> => {
  if (hasInjectedPage(page)) return;
  addInjectedPage(page);
  const script = buildScript(SNIPPETS);
  try {
    await page.evaluate(script);
  } catch {}
  await page.addInitScript(script);
};
