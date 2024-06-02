class TextSlicer {
  private readonly textElement: HTMLElement | null;

  private originalText: string;

  private readonly splitMode: 'words' | 'chars' | 'both';

  private readonly cssVariables: boolean;

  private readonly dataAttributes: boolean;

  private charIndexCounter: number;

  public constructor(options: {
    container?: HTMLElement | string;
    splitMode?: 'words' | 'chars' | 'both';
    cssVariables?: boolean;
    dataAttributes?: boolean;
  } = {}) {
    this.textElement = options.container instanceof HTMLElement
      ? options.container
      : document.querySelector(options.container || '.text-slicer');

    if (!this.textElement) {
      this.originalText = '';
      this.splitMode = 'both';
      this.cssVariables = false;
      this.dataAttributes = false;
      this.charIndexCounter = 0;
      return;
    }

    this.originalText = this.textElement.textContent?.trim() || '';
    this.splitMode = options.splitMode || 'both';
    this.cssVariables = options.cssVariables || false;
    this.dataAttributes = options.dataAttributes || false;
    this.charIndexCounter = 0;
  }

  public split(): void {
    if (!this.textElement) return;

    this.clear();
    this.charIndexCounter = 0;

    const fragment = document.createDocumentFragment();
    const words = this.originalText.split(' ');
    const charCount = this.originalText.length;

    if (this.splitMode === 'words' || this.splitMode === 'both') {
      this.splitWords(fragment, words);
    } else if (this.splitMode === 'chars') {
      this.splitChars(fragment);
    }

    this.textElement.appendChild(fragment);

    if (this.cssVariables) {
      this.textElement.style.setProperty('--word-total', words.length.toString());
      this.textElement.style.setProperty('--char-total', charCount.toString());
    }
  }

  private splitWords(fragment: DocumentFragment, words: string[]): void {
    words.forEach((word, wordIndex) => {
      if (this.splitMode === 'both') {
        const wordSpan = this.createWordSpan(wordIndex, word);

        word.split('').forEach((char) => {
          const charSpan = this.createCharSpan(char);
          wordSpan.append(charSpan);
        });

        fragment.append(wordSpan);
      } else {
        const wordSpan = this.createWordSpan(wordIndex);
        wordSpan.append(document.createTextNode(word));
        fragment.append(wordSpan);
      }

      if (wordIndex < words.length - 1) {
        fragment.append(TextSlicer.createSpaceSpan());
      }
    });
  }

  private splitChars(fragment: DocumentFragment): void {
    this.originalText.split('').forEach((char) => {
      const charSpan = this.createCharSpan(char);
      fragment.append(charSpan);
    });
  }

  private createWordSpan(index: number, word: string = ''): HTMLElement {
    const wordSpan = document.createElement('span');
    wordSpan.classList.add('word');

    if (this.dataAttributes) {
      wordSpan.setAttribute('data-word', word);
    }

    if (this.cssVariables) {
      wordSpan.style.setProperty('--word-index', index.toString());
    }

    return wordSpan;
  }

  private createCharSpan(char: string): HTMLElement {
    const charSpan = document.createElement('span');
    charSpan.textContent = char;

    if (this.dataAttributes) {
      charSpan.setAttribute('data-char', char);
    }

    if (char === ' ') {
      charSpan.classList.add('whitespace');
    } else {
      charSpan.classList.add('char');

      if (this.cssVariables) {
        charSpan.style.setProperty('--char-index', this.charIndexCounter.toString());
      }

      this.charIndexCounter += 1;
    }

    return charSpan;
  }

  private static createSpaceSpan(): HTMLElement {
    const spaceSpan = document.createElement('span');
    spaceSpan.classList.add('whitespace');
    spaceSpan.textContent = ' ';

    return spaceSpan;
  }

  private clear(): void {
    if (this.textElement) {
      this.textElement.innerHTML = '';
    }
  }

  public init(): void {
    this.split();
  }
}

export default TextSlicer;
