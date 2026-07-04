# text-slicer

Create word and grapheme-level DOM hooks from plain text for animation and styling.

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.com/package/text-slicer)

[Demo](https://codepen.io/ux-ui/full/vYMoGoG)

---

## Features

- Split short plain text into words, graphemes, or both.
- Use locale-aware word and grapheme segmentation with `Intl.Segmenter`.
- Add CSS hooks through `--word-index`, `--char-index`, `--word-total`, and `--char-total`.
- Add optional `data-word` and `data-char` attributes when scripting needs the raw text.
- Clean up with lifecycle methods such as `destroy()`, `reinit()`, `lockHeight()`, and `unlockHeight()`.
- Read render metrics with `onAfterRender`.

---

## Installation

```bash
npm install text-slicer
```

---

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
  const textSlicers = Array.from(
    document.querySelectorAll<HTMLElement>('.text-slicer'),
    (container) => {
      const textSlicer = new TextSlicer({ container });

      textSlicer.init();

      return textSlicer;
    },
  );

  // Later, before removing the elements, replacing this section,
  // or cleaning up during SPA route changes:
  const destroyTextSlicers = () => {
    textSlicers.forEach((textSlicer) => textSlicer.destroy());
  };
});
```

---

## API

```ts
import { TextSlicer, CLASSNAMES } from 'text-slicer';
```

- `TextSlicer` — the main class.
- `CLASSNAMES` — class map for `word`, `char`, and `whitespace`.
- Types: `SplitMode`, `TextSlicerOptions`, `TextSlicerMetrics`, `TextSlicerCallbacks`.

Constructor:

```ts
new TextSlicer(options?, callbacks?);
```

---

## Options

| Option | Type | Default | Description |
|:--|:--|:--:|:--|
| `container` | `HTMLElement \| string` | `undefined` | Target element or selector. One `TextSlicer` instance manages one element. |
| `splitMode` | `'words' \| 'chars' \| 'both'` | `both` | Split into words, graphemes, or both. |
| `cssVariables` | `boolean` | `false` | Sets `--word-index` / `--char-index` on generated spans and `--word-total` / `--char-total` on the container. |
| `dataAttributes` | `boolean` | `false` | Adds `data-word` and `data-char` attributes. |
| `keepWhitespaceNodes` | `boolean` | `true` | When `false`, whitespace stays visible as text nodes instead of `.ts-whitespace` spans in character-based modes. |
| `containerHeightVar` | `boolean` | `false` | Sets `--container-height` from `ResizeObserver` measurements when available. |
| `locale` | `string \| string[]` | `undefined` | Locale passed to `Intl.Segmenter`; omitted means the runtime default locale. |

---

## Callbacks

| Callback | Arguments | Description |
|:--|:--|:--|
| `onAfterRender` | `TextSlicerMetrics` | Runs after render with `wordTotal`, `charTotal`, and `renderedAt`. |

`charTotal` counts non-whitespace grapheme clusters, not UTF-16 code units. In `chars` and `both` modes it matches rendered `.ts-char` spans. In `words` mode, metrics still describe the original plain text even though character spans are not rendered.

---

## Methods

| Method | Description |
|:--|:--|
| `init()` | Render the current text and mark the instance mounted. |
| `reinit(newText?, options?)` | Render again, optionally with new plain text and updated options. |
| `clear()` | Remove rendered children and restore library-owned accessibility attributes. Use `destroy()` for full cleanup. |
| `split()` | Render the current text again. |
| `destroy()` | Disconnect observers, restore library-owned styles and attributes, remove generated spans, and put the original plain text back. |
| `updateOptions(options)` | Update options and re-render if the instance is mounted. |
| `lockHeight()` | Lock the container height to its measured value. |
| `unlockHeight()` | Restore the previous inline `height`. |
| `metrics` | Return metrics computed from the original plain text. |

---

## Splitting Semantics

- `words`: word-like segments become `.ts-word`; punctuation stays visible but is not counted as a word.
- `chars`: non-whitespace grapheme clusters become `.ts-char`.
- `both`: word-like segments become `.ts-word`, and every non-whitespace grapheme, including punctuation, becomes `.ts-char`.

Word-like segments come from `Intl.Segmenter` with `granularity: 'word'`. Whitespace stays visible as `.ts-whitespace` spans, or as plain text nodes when `keepWhitespaceNodes: false` is used in character-based modes.

---

## Limitations

- Plain text only: nested markup is not preserved. `destroy()` restores `textContent`, not the original child nodes.
- Best for short headings, labels, and animation copy. Long text can create a lot of DOM nodes.
- `split()` and `updateOptions()` rebuild the generated content.
- `Intl.Segmenter` is used when available. The fallback is simpler and may miss locale-specific word boundaries or complex emoji clusters.
- Client-only: call `init()` after mount in SSR frameworks.

---

## Accessibility

Generated visual spans are marked `aria-hidden="true"`.

If the container has no `aria-label` or `aria-labelledby`, TextSlicer adds a managed `aria-label` with the original plain text and restores it on cleanup.

If you provide your own `aria-label` or `aria-labelledby`, TextSlicer leaves it alone. Keep your custom accessible label in sync when calling `reinit()` with new text.

---

## Framework Integration

Call `init()` only after the element exists in the browser. Call `destroy()` before unmounting or replacing the element.

React / Next.js:

```tsx
useEffect(() => {
  const slicer = new TextSlicer({
    container: ref.current,
    splitMode: 'chars',
    cssVariables: true,
  });

  slicer.init();

  return () => slicer.destroy();
}, []);
```

Vue:

```ts
onMounted(() => {
  slicer = new TextSlicer({ container: el.value });
  slicer.init();
});

onBeforeUnmount(() => slicer?.destroy());
```

Svelte:

```ts
onMount(() => {
  const slicer = new TextSlicer({ container: node });
  slicer.init();

  return () => slicer.destroy();
});
```

---

## Styling

Exported `CLASSNAMES`:

- `ts-word` — word wrapper.
- `ts-char` — character span.
- `ts-whitespace` — whitespace span.

When `cssVariables: true`, `--word-total` and `--char-total` are set on the container. `--word-index` is set on `.ts-word` spans, and `--char-index` is set on non-whitespace `.ts-char` spans.

`--container-height` is based on `ResizeObserver` measurements when `containerHeightVar: true` and the platform API is available.

Staggered character reveal:

```css
.ts-char {
  opacity: 0;
  transform: translateY(0.5em);
  animation: char-in 0.4s ease forwards;
  animation-delay: calc(var(--char-index) * 40ms);
}

@keyframes char-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Browser Support

`Intl.Segmenter` is required for correct word and grapheme splitting. Without it, TextSlicer uses a simplified fallback; emoji and complex grapheme clusters may be incorrect.

`containerHeightVar` is a no-op when `ResizeObserver` is unavailable.

---

## License

MIT
