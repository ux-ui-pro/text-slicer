<br>
<p align="center"><strong>text-slicer</strong></p>

<div align="center">

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/text-slicer.svg)](https://github.com/ux-ui-pro/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.org/package/text-slicer)

</div>

<p align="center">TextSlicer is designed to split text within an HTML element into separate words and/or characters, wrapping each word and/or character in separate span elements.</p>
<p align="center"><sup>850B gzipped</sup></p>
<p align="center"><a href="https://codepen.io/ux-ui/full/vYMoGoG">Demo</a></p>
<br>

&#10148; **Install**

```console
yarn add text-slicer
```
<br>

&#10148; **Import**

```javascript
import TextSlicer from 'text-slicer';
```
<br>

&#10148; **Usage**

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
  });

  textSlicer.init();
});
```

<sub>How to apply the TextSlicer class to all elements on a page</sub>
```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.text-slicer').forEach((element) => {
    const textSlicer = new TextSlicer({
      container: element,
    });

    textSlicer.init();
  });
});
```
<br>

&#10148; **Parameters**

|      Option       |          Type           |    Default     | Description                                                                                                                                           |
|:-----------------:|:-----------------------:|:--------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------|
|    `container`    | `HTMLElement \| string` | `.text-slicer` | The container element or a selector for the element containing the text to be split. You can pass either a DOM element or a CSS selector string.      |
|    `splitMode`    |        `string`         |     `both`     | Determines how the text will be split: 'words' to split into words, 'chars' to split into characters, 'both' to split into both words and characters. |
|  `cssVariables`   |        `boolean`        |    `false`     | If `true`, CSS variables for word and character indexes will be added to the spans.                                                                   |
| `dataAttributes`  |        `boolean`        |    `false`     | If `true`, `data-word` and `data-char` attributes will be added to the generated word and character spans for additional data handling or styling.    |
<br>

&#10148; **License**

text-slicer is released under MIT license
