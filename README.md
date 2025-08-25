<p align="center"><strong>text-slicer</strong></p>

<div align="center">

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/text-slicer.svg)](https://github.com/ux-ui-pro/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.org/package/text-slicer)

</div>

<p align="center">Split text inside an HTML element into words and/or characters, wrapping each in a dedicated <code>&lt;span&gt;</code>. Built for robust animation pipelines and i18n-safe rendering.</p>
<p align="center"><a href="https://codepen.io/ux-ui/full/vYMoGoG">Demo</a></p>
<br>

## Install

```bash
yarn add text-slicer
# or
npm i text-slicer
```
<br>

## Quick start

```ts
import { TextSlicer } from 'text-slicer';

const slicer = new TextSlicer({ container: '.text-slicer' });

slicer.init();
```

Initialize per element:

```ts
document.querySelectorAll('.text-slicer').forEach((el) => {
  const slicer = new TextSlicer({ container: el });

  slicer.init();
});
```
<br>

## API

### Types

```ts
export type SplitMode = 'words' | 'chars' | 'both';

export interface TextSlicerOptions {
  container?: HTMLElement | string;
  splitMode?: SplitMode;
  cssVariables?: boolean;
  dataAttributes?: boolean;
  /** Keep dedicated whitespace nodes between words (for precise animations). Default: true */
  keepWhitespaceNodes?: boolean;
  /** Freeze measured word widths to avoid reflow jitter on responsive layouts. Default: false */
  freezeWordWidths?: boolean;
}

export interface TextSlicerMetrics {
  wordTotal: number;
  charTotal: number;
  renderedAt: number;
}

export interface TextSlicerCallbacks {
  onAfterRender?: (metrics: TextSlicerMetrics) => void;
}
```

### Classnames & CSS vars

```ts
import { CLASSNAMES } from 'text-slicer';

// Classes applied to generated spans
CLASSNAMES.word       // 'ts-word'
CLASSNAMES.char       // 'ts-char'
CLASSNAMES.whitespace // 'ts-whitespace'

// CSS variables placed on container and items (when cssVariables: true)
--word-total
--char-total
--word-index
--char-index
```

### Constructor

```ts
new TextSlicer(options?: TextSlicerOptions, callbacks?: TextSlicerCallbacks)
```

### Methods

- `init(): void` – Perform initial split.
- `reinit(newText?: string, nextOpts?: Partial<TextSlicerOptions>): void` – Update text and/or options and re-split.
- `updateOptions(next: Partial<TextSlicerOptions>): void` – Merge options and re-split (if mounted).
- `clear(): void` – Remove generated nodes and unfreeze widths.
- `split(): void` – (Re)build DOM (called internally by `init`/`reinit`/`updateOptions`).
- `destroy(): void` – Detach observers, clear DOM, and mark unmounted.
- `get metrics(): TextSlicerMetrics` – Read-only metrics collected on the last render.

### Options in detail

- `splitMode` – `'words' | 'chars' | 'both'`. When `'both'`, each word is wrapped and further split into graphemes.
- `cssVariables` – When `true`, indexes and totals are exposed as CSS custom properties for stagger animations.
- `dataAttributes` – When `true`, adds `data-word` / `data-char` attributes.
- `keepWhitespaceNodes` – When `true`, explicit whitespace nodes are inserted between words (class `ts-whitespace`).
- `freezeWordWidths` – When `true`, measured widths of `.ts-word` nodes are frozen (after fonts load + next frame) and
  kept in sync on container/window resize to prevent layout jitter during animations.

### i18n-friendly grapheme splitting

Characters are split using `Intl.Segmenter` (when available) with `{ granularity: 'grapheme' }`, so compound emoji and
grapheme clusters render as expected. Environments without `Intl.Segmenter` gracefully fall back to `Array.from(text)`.

### Callbacks

```ts
const slicer = new TextSlicer(
  { container: '.title', cssVariables: true },
  {
    onAfterRender(metrics) {
      // e.g. attach animation based on metrics.charTotal
      console.log(metrics);
    },
  }
);
slicer.init();
```

### Responsive width freezing

```ts
const slicer = new TextSlicer({
  container: '.headline',
  splitMode: 'both',
  freezeWordWidths: true,
});
slicer.init();
```

When enabled, widths are measured after fonts are ready and then frozen (`flex: 0 0 auto; width: <px>`). A `ResizeObserver`
watches the container and a `resize` handler remeasures on viewport changes.
<br>

## CSS usage example

```css
.ts-char {
  display: inline-block;
  transform: translateY(0.75em);
  opacity: 0;
  transition: transform 400ms ease, opacity 400ms ease;
}

.ts-char.appear {
  transform: translateY(0);
  opacity: 1;
}

/* stagger via CSS variables */
.ts-char {
  transition-delay: calc(var(--char-index, 0) * 10ms);
}
```
<br>

## License

MIT
