class TextSlicer {
  #textElement;

  #originalText;

  #splitMode;

  #cssVariables;

  #dataAttributes;

  #charIndexCounter;

  /**
   * @param {Object} options - Configuration options for the TextSlicer.
   * @param {HTMLElement|string} [options.container] - The container element or a selector for the text to split.
   * @param {string} [options.splitMode='both'] - The splitMode, can be 'words', 'chars', or 'both'.
   * @param {boolean} [options.cssVariables=false] - Whether to use CSS variables for indices.
   * @param {boolean} [options.dataAttributes=false] - Whether to add data attributes for words and chars.
   */

  constructor(options = {}) {
    this.#textElement = options.container instanceof HTMLElement
      ? options.container
      : document.querySelector(options.container || '.text-slicer');

    if (!this.#textElement) {
      return;
    }

    this.#originalText = this.#textElement.textContent.trim();
    this.#splitMode = options.splitMode || 'both';
    this.#cssVariables = options.cssVariables || false;
    this.#dataAttributes = options.dataAttributes || false;
    this.#charIndexCounter = 0;
  }

  split() {
    if (!this.#textElement) return;

    this.#clear();
    this.#charIndexCounter = 0;

    const fragment = document.createDocumentFragment();
    const words = this.#originalText.split(' ');
    const charCount = this.#originalText.length;

    if (this.#splitMode === 'words' || this.#splitMode === 'both') {
      this.#splitWords(fragment, words);
    } else if (this.#splitMode === 'chars') {
      this.#splitChars(fragment);
    }

    this.#textElement.appendChild(fragment);

    if (this.#cssVariables) {
      this.#textElement.style.setProperty('--word-total', words.length);
      this.#textElement.style.setProperty('--char-total', charCount);
    }
  }

  #splitWords(fragment, words) {
    words.forEach((word, wordIndex) => {
      if (this.#splitMode === 'both') {
        const wordSpan = this.#createWordSpan(wordIndex, word);

        word.split('').forEach((char) => {
          const charSpan = this.#createCharSpan(char);

          wordSpan.append(charSpan);
        });

        fragment.append(wordSpan);
      } else {
        const wordSpan = this.#createWordSpan(wordIndex);

        wordSpan.append(document.createTextNode(word));
        fragment.append(wordSpan);
      }

      if (wordIndex < words.length - 1) {
        fragment.append(TextSlicer.#createSpaceSpan());
      }
    });
  }

  #splitChars(fragment) {
    this.#originalText.split('').forEach((char) => {
      const charSpan = this.#createCharSpan(char);

      fragment.append(charSpan);
    });
  }

  #createWordSpan(index, word = '') {
    const wordSpan = document.createElement('span');

    wordSpan.classList.add('word');

    if (this.#dataAttributes) {
      wordSpan.setAttribute('data-word', word);
    }

    if (this.#cssVariables) {
      wordSpan.style.setProperty('--word-index', index);
    }

    return wordSpan;
  }

  #createCharSpan(char) {
    const charSpan = document.createElement('span');

    charSpan.textContent = char;

    if (this.#dataAttributes) {
      charSpan.setAttribute('data-char', char);
    }

    if (char === ' ') {
      charSpan.classList.add('whitespace');
    } else {
      charSpan.classList.add('char');

      if (this.#cssVariables) {
        charSpan.style.setProperty('--char-index', this.#charIndexCounter);
      }

      this.#charIndexCounter += 1;
    }

    return charSpan;
  }

  static #createSpaceSpan() {
    const spaceSpan = document.createElement('span');

    spaceSpan.classList.add('whitespace');
    spaceSpan.textContent = ' ';

    return spaceSpan;
  }

  #clear() {
    this.#textElement.innerHTML = '';
  }

  init() {
    this.split();
  }
}

export default TextSlicer;
