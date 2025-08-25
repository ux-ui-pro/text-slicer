<p align="center"><strong>text-slicer</strong></p>

<div align="center">

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/text-slicer.svg)](https://github.com/ux-ui-pro/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.org/package/text-slicer)

</div>

<p align="center">TextSlicer splits text within an HTML element into words and/or characters, wrapping each in individual spans. It provides flexible options, CSS variable integration, lifecycle management, and callbacks for post-render handling.</p>
<p align="center"><sup>1.5kB gzipped</sup></p>
<p align="center"><a href="https://codepen.io/ux-ui/full/vYMoGoG">Demo</a></p>
<br>

➠ **Install**

```console
yarn add text-slicer
```
<br>

➠ **Import**

```javascript
import { TextSlicer } from 'text-slicer';
```
<br>

➠ **Usage**

```javascript
const textSlicer = new TextSlicer();

textSlicer.init();
```

<sub>Initialization with specified parameters</sub>
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const textSlicer = new TextSlicer({
    container: '.text-slicer',
    splitMode: 'both',
    cssVariables: true,
    dataAttributes: true,
  }, {
    onAfterRender: (metrics) => console.log(metrics)
  });

  textSlicer.init();
});
```

<sub>How to apply the TextSlicer class to all elements on a page</sub>
```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.text-slicer').forEach((element) => {
    const textSlicer = new TextSlicer({ container: element });

    textSlicer.init();
  });
});
```
<br>

➠ **Options**

|        Option        |          Type           |   Default    | Description                                                                                                                                              |
|:--------------------:|:-----------------------:|:------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
|      `container`     | `HTMLElement \| string` | `undefined`  | The target element or selector for text splitting.                                                                                                       |
|      `splitMode`     |   `'words' \| 'chars' \| 'both'`   |   `both`     | Defines splitting mode: by words, characters, or both.                                                                                                   |
|    `cssVariables`    |        `boolean`        |   `false`    | Enables CSS variables like `--word-index` and `--char-index` for each span.                                                                               |
|   `dataAttributes`   |        `boolean`        |   `false`    | Adds `data-word` and `data-char` attributes for additional styling or scripting.                                                                          |
| `keepWhitespaceNodes`|        `boolean`        |    `true`    | If `false`, whitespace nodes will be ignored when splitting characters.                                                                                  |
| `containerHeightVar` |        `boolean`        |   `false`    | If `true`, sets a dynamic CSS variable `--container-height` that updates on resize.                                                                       |

<br>

➠ **Callbacks**

| Callback        | Arguments             | Description                                                                                             |
|-----------------|-----------------------|---------------------------------------------------------------------------------------------------------|
| `onAfterRender` | `TextSlicerMetrics`   | Invoked after rendering. Provides `wordTotal`, `charTotal`, and `renderedAt` timestamp.                  |

<br>

➠ **API Methods**

| Method            | Description                                                                                      |
|-------------------|--------------------------------------------------------------------------------------------------|
| `init()`          | Initializes and renders text splitting.                                                          |
| `reinit(newText?, options?)` | Re-initializes with optional new text and updated options.                              |
| `clear()`         | Clears all content inside the container element.                                                  |
| `split()`         | Manually triggers splitting and rendering.                                                        |
| `destroy()`       | Cleans up instance, observers, and styles.                                                        |
| `updateOptions()` | Updates options at runtime and re-renders if mounted.                                             |
| `lockHeight()`    | Locks container height to its measured value.                                                     |
| `unlockHeight()`  | Unlocks container height.                                                                         |
| `metrics` (getter)| Returns current metrics: `wordTotal`, `charTotal`, and `renderedAt`.                              |

<br>

➠ **License**

text-slicer is released under MIT license
