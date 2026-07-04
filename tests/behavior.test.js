import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

function installDomGlobals() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { window } = dom;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.DocumentFragment = window.DocumentFragment;
  globalThis.Node = window.Node;
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
}

test('splitMode words creates two word spans for "Hello world"', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('p');

  el.textContent = 'Hello world';
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, splitMode: 'words' });

  slicer.init();

  assert.equal(el.querySelectorAll(`.${CLASSNAMES.word}`).length, 2);
});

test('dataAttributes + splitMode words sets data-word', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hello world';
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'words',
    dataAttributes: true,
  });

  slicer.init();

  const words = [...el.querySelectorAll(`.${CLASSNAMES.word}`)];

  assert.equal(words.length, 2);
  assert.equal(words[0]?.getAttribute('data-word'), 'Hello');
  assert.equal(words[1]?.getAttribute('data-word'), 'world');
});

test('splitMode words wraps punctuation in hidden spans', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hi!';
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, splitMode: 'words' });

  slicer.init();

  assert.equal(el.textContent, 'Hi!');
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.word}`).length, 1);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 0);

  const rawNonWhitespace = [...el.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim(),
  );

  assert.equal(rawNonWhitespace, false);
});

test('splitMode both wraps punctuation as char spans', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hi!';
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'both',
    cssVariables: true,
  });

  slicer.init();

  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 3);
  assert.equal(el.style.getPropertyValue('--char-total'), '3');
  assert.equal(el.textContent, 'Hi!');

  slicer.destroy();
  assert.equal(el.textContent, 'Hi!');
});

test('reinit remounts lifecycle after destroy', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hello';
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, splitMode: 'words' });

  slicer.init();
  slicer.destroy();
  slicer.reinit('Hi!');
  slicer.updateOptions({ splitMode: 'chars' });

  assert.equal(el.textContent, 'Hi!');
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 3);
});

test('managed CSS custom properties restore author values on destroy', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hi';
  el.style.setProperty('--char-total', 'author-value');
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'chars',
    cssVariables: true,
  });

  slicer.init();
  assert.equal(el.style.getPropertyValue('--char-total'), '2');

  slicer.destroy();
  assert.equal(el.style.getPropertyValue('--char-total'), 'author-value');
});

test('managed CSS custom properties restore author !important priority', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'Hello';
  el.style.setProperty('--char-total', '999', 'important');
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, cssVariables: true });

  slicer.init();
  slicer.destroy();

  assert.equal(el.style.getPropertyValue('--char-total'), '999');
  assert.equal(el.style.getPropertyPriority('--char-total'), 'important');
});

test('emoji grapheme counts as one char in metrics', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('p');
  const text = '👋';

  el.textContent = text;
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, splitMode: 'chars' });

  slicer.init();

  assert.equal(slicer.metrics.charTotal, 1);
  assert.ok(text.length > 1, 'UTF-16 length should exceed grapheme count for emoji');
});

test('CRLF is whitespace, not a character', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');

  el.textContent = 'a\r\nb';
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'chars',
    cssVariables: true,
  });

  slicer.init();

  assert.equal(el.textContent, 'a\r\nb');
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 2);
  assert.equal(el.style.getPropertyValue('--char-total'), '2');
});

test('keepWhitespaceNodes false preserves visible spaces in chars mode', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('p');
  const text = 'Hello world';

  el.textContent = text;
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'chars',
    keepWhitespaceNodes: false,
  });

  slicer.init();

  assert.equal(el.textContent, text);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.whitespace}`).length, 0);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 10);
});

test('keepWhitespaceNodes false works in both mode', async () => {
  installDomGlobals();

  const { TextSlicer, CLASSNAMES } = await import('../dist/index.js');
  const el = document.createElement('div');
  const text = 'a b';

  el.textContent = text;
  document.body.append(el);

  const slicer = new TextSlicer({
    container: el,
    splitMode: 'both',
    keepWhitespaceNodes: false,
    cssVariables: true,
  });

  slicer.init();

  assert.equal(el.textContent, text);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.word}`).length, 2);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.char}`).length, 2);
  assert.equal(el.querySelectorAll(`.${CLASSNAMES.whitespace}`).length, 0);
  assert.equal(el.style.getPropertyValue('--char-total'), '2');
});

test('existing aria-label is not overwritten while active', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('h1');

  el.textContent = 'Hello';
  el.setAttribute('aria-label', 'Original label');
  document.body.append(el);

  const slicer = new TextSlicer({ container: el });

  slicer.init();
  assert.equal(el.getAttribute('aria-label'), 'Original label');

  slicer.destroy();
  assert.equal(el.getAttribute('aria-label'), 'Original label');
  assert.equal(el.textContent, 'Hello');
});

test('aria-labelledby is left untouched', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const label = document.createElement('span');

  label.id = 'title-label';
  label.textContent = 'External label';
  document.body.append(label);

  const el = document.createElement('h1');

  el.textContent = 'Hello';
  el.setAttribute('aria-labelledby', 'title-label');
  document.body.append(el);

  const slicer = new TextSlicer({ container: el });

  slicer.init();
  assert.equal(el.getAttribute('aria-labelledby'), 'title-label');
  assert.equal(el.hasAttribute('aria-label'), false);

  slicer.destroy();
  assert.equal(el.getAttribute('aria-labelledby'), 'title-label');
  assert.equal(el.hasAttribute('aria-label'), false);
});

test('library-owned aria-label updates on reinit and is removed on destroy', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('h1');

  el.textContent = 'Hello';
  document.body.append(el);

  const slicer = new TextSlicer({ container: el });

  slicer.init();
  assert.equal(el.getAttribute('aria-label'), 'Hello');

  slicer.reinit('Goodbye');
  assert.equal(el.getAttribute('aria-label'), 'Goodbye');

  slicer.destroy();
  assert.equal(el.hasAttribute('aria-label'), false);
  assert.equal(el.textContent, 'Goodbye');
});

test('init does not throw when ResizeObserver is unavailable', async () => {
  installDomGlobals();

  const OriginalResizeObserver = globalThis.ResizeObserver;

  try {
    // @ts-expect-error test-only override
    globalThis.ResizeObserver = undefined;

    const { TextSlicer } = await import('../dist/index.js');
    const el = document.createElement('div');

    el.textContent = 'Hello';
    document.body.append(el);

    const slicer = new TextSlicer({ container: el, containerHeightVar: true });

    slicer.init();
    assert.equal(el.textContent, 'Hello');
  } finally {
    globalThis.ResizeObserver = OriginalResizeObserver;
  }
});

test('cssVariables sets char-total from graphemes not UTF-16 length', async () => {
  installDomGlobals();

  const { TextSlicer } = await import('../dist/index.js');
  const el = document.createElement('p');
  const text = '👋';

  el.textContent = text;
  document.body.append(el);

  const slicer = new TextSlicer({ container: el, splitMode: 'chars', cssVariables: true });

  slicer.init();

  assert.equal(el.style.getPropertyValue('--char-total'), '1');
});
