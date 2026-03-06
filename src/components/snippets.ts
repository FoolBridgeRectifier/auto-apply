import { Page } from '@playwright/test';
import { SNIPPETS } from '../../config';

const buildScript = (snippets: Record<string, string>): string => `(function() {
  if (window.__snippetsInjected) return;
  window.__snippetsInjected = true;
  var snippets = ${JSON.stringify(snippets)};
  document.addEventListener('keydown', function(e) {
    if (e.key !== ' ' && e.key !== 'Tab' && e.key !== 'Enter') return;
    var el = document.activeElement;
    if (!el) return;
    var tag = el.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    if (el.type === 'password') return;
    var value = el.value;
    var cursor = el.selectionStart;
    if (typeof cursor !== 'number') return;
    var textBefore = value.slice(0, cursor);
    var match = textBefore.match(/(\\S+)$/);
    if (!match) return;
    var word = match[1];
    if (!snippets[word]) return;
    e.preventDefault();
    var expansion = snippets[word];
    var before = value.slice(0, cursor - word.length);
    var after = value.slice(cursor);
    var newValue = before + expansion + after;
    var proto = tag === 'TEXTAREA'
      ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
      : Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (proto && proto.set) proto.set.call(el, newValue);
    else el.value = newValue;
    var newCursor = before.length + expansion.length;
    el.setSelectionRange(newCursor, newCursor);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: expansion }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);
})()`;

const injectedPages = new WeakSet<Page>();

export const injectSnippets = async (page: Page): Promise<void> => {
  if (injectedPages.has(page)) return;
  injectedPages.add(page);
  const script = buildScript(SNIPPETS);
  try {
    await page.evaluate(script);
  } catch {}
  await page.addInitScript(script);
};
