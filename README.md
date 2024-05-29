<br>
<p align="center"><strong>text-slicer</strong></p>

<div align="center">

[![npm](https://img.shields.io/npm/v/text-slicer.svg?colorB=brightgreen)](https://www.npmjs.com/package/text-slicer)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/text-slicer.svg)](https://github.com/ux-ui-pro/text-slicer)
[![NPM Downloads](https://img.shields.io/npm/dm/text-slicer.svg?style=flat)](https://www.npmjs.org/package/text-slicer)

</div>

<p align="center">TextSlicer is designed to split text within an HTML element into separate words and/or characters, wrapping each word and/or character in separate span elements.</p>
<p align="center"><sup>1kB gzipped</sup></p>
<p align="center"><a href="https://codepen.io/ux-ui/pen/vYMoGoG">Demo</a></p>
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
<br>
Initialization with specified parameters
<br>

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const textSlicer = new TextSlicer({
    container: '.text-slicer',
    mode: 'both',
    cssVariables: true,
  });

  textSlicer.init();
});
```
<br>
How to apply the TextSlicer class to all elements on a page
<br>

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

|     Option     |          Type           |    Default     | Description                                                                                                      |
|:--------------:|:-----------------------:|:--------------:|:-----------------------------------------------------------------------------------------------------------------|
|  `container`   | `HTMLElement \| string` | `.text-slicer` | The element or selector of the element containing the text to be split.                                          |
|     `mode`     |        `string`         |     `both`     | Text split mode: 'words' to split into words, 'chars' to split into characters, 'both' to split into both types. |
| `cssVariables` |        `boolean`        |    `false`     | A logical value indicating whether to add CSS variables for word and character indexes.                          |
<br>

&#10148; **License**

text-slicer is released under MIT license
