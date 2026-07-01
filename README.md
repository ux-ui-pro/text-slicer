# text-slicer

Split text inside an HTML element into words and/or characters, wrapping each fragment in its own span.

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.com/package/text-slicer)

[Demo](https://codepen.io/ux-ui/full/vYMoGoG)

---

- Split by words, characters, or both (`splitMode`).
- Optional CSS variables (`--word-index`, `--char-index`, `--word-total`, `--char-total`, `--container-height`).
- Optional `data-word` / `data-char` attributes for styling or scripting.
- Lifecycle helpers: `init`, `reinit`, `clear`, `split`, `destroy`, `updateOptions`, `lockHeight`, `unlockHeight`.
- `onAfterRender` callback with word/char totals and timestamp.
- ~1.5kB gzipped.

---

## Installation

```bash
npm install text-slicer
```

## Quick Start

HTML:

```html
<p class="text-slicer">Hello world</p>
```

JavaScript:

```ts
import { TextSlicer } from 'text-slicer';

const textSlicer = new TextSlicer({ container: '.text-slicer' });

textSlicer.init();
```

With options and a callback:

```ts
document.addEventListener('DOMContentLoaded', () => {
  const textSlicer = new TextSlicer(
    {
      container: '.text-slicer',
      splitMode: 'both',
      cssVariables: true,
      dataAttributes: true,
    },
    {
      onAfterRender: (metrics) => console.log(metrics),
    },
  );

  textSlicer.init();
});
```

Apply to every matching element on the page:

```ts
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.text-slicer').forEach((element) => {
    const textSlicer = new TextSlicer({ container: element });

    textSlicer.init();
  });
});
```

## API

Named exports:

```ts
import { TextSlicer, CLASSNAMES } from 'text-slicer';
```

- `TextSlicer` — main class.
- `CLASSNAMES` — BEM-style class map (`word`, `char`, `whitespace`).
- Types: `SplitMode`, `TextSlicerOptions`, `TextSlicerMetrics`, `TextSlicerCallbacks`.

Constructor: `new TextSlicer(options?, callbacks?)`.

## Options

| Option                | Type                    | Default     | Description                                                                 |
|:----------------------|:------------------------|:-----------:|:----------------------------------------------------------------------------|
| `container`           | `HTMLElement \| string` | `undefined` | Target element or selector for text splitting.                              |
| `splitMode`           | `'words' \| 'chars' \| 'both'` | `both` | Split by words, characters, or both.                                        |
| `cssVariables`        | `boolean`               | `false`     | Sets `--word-index`, `--char-index`, `--word-total`, `--char-total` on spans. |
| `dataAttributes`      | `boolean`               | `false`     | Adds `data-word` and `data-char` attributes.                                |
| `keepWhitespaceNodes` | `boolean`               | `true`      | When `false`, whitespace nodes are ignored in character mode.               |
| `containerHeightVar`  | `boolean`               | `false`     | Sets dynamic `--container-height` via `ResizeObserver`.                     |

## Callbacks

| Callback        | Arguments           | Description                                                              |
|-----------------|---------------------|--------------------------------------------------------------------------|
| `onAfterRender` | `TextSlicerMetrics` | Called after render; provides `wordTotal`, `charTotal`, `renderedAt`.      |

## Methods

| Method                         | Description                                              |
|--------------------------------|----------------------------------------------------------|
| `init()`                       | Initializes and renders text splitting.                  |
| `reinit(newText?, options?)`   | Re-initializes with optional new text and updated options. |
| `clear()`                      | Clears all content inside the container.                 |
| `split()`                      | Manually triggers splitting and rendering.               |
| `destroy()`                    | Cleans up instance, observers, and styles.               |
| `updateOptions(options)`       | Updates options at runtime; re-renders if mounted.       |
| `lockHeight()`                 | Locks container height to its measured value.            |
| `unlockHeight()`               | Unlocks container height.                                |
| `metrics` (getter)             | Returns `wordTotal`, `charTotal`, and `renderedAt`.      |

## Styling

Exported `CLASSNAMES`:

- `ts-word` — word wrapper (when splitting includes words).
- `ts-char` — character span.
- `ts-whitespace` — whitespace span.

When `cssVariables: true`, spans receive `--word-index`, `--char-index`; the container may receive `--word-total`, `--char-total`, and (with `containerHeightVar`) `--container-height`.

## License

MIT
