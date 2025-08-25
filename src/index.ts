export type SplitMode = 'words' | 'chars' | 'both';

export interface TextSlicerOptions {
  container?: HTMLElement | string;
  splitMode?: SplitMode;
  cssVariables?: boolean;
  dataAttributes?: boolean;
  keepWhitespaceNodes?: boolean;
  containerHeightVar?: boolean;
}

export interface TextSlicerMetrics {
  wordTotal: number;
  charTotal: number;
  renderedAt: number;
}

export interface TextSlicerCallbacks {
  onAfterRender?: (metrics: TextSlicerMetrics) => void;
}

type RuntimeOptions = Required<Omit<TextSlicerOptions, 'container'>>;

const DEFAULT_OPTIONS: RuntimeOptions = {
  splitMode: 'both',
  cssVariables: false,
  dataAttributes: false,
  keepWhitespaceNodes: true,
  containerHeightVar: false,
};

export const CLASSNAMES = Object.freeze({
  word: 'ts-word',
  char: 'ts-char',
  whitespace: 'ts-whitespace',
});

const SPACE = ' ';
const CSS_VAR_WORD_TOTAL = '--word-total';
const CSS_VAR_CHAR_TOTAL = '--char-total';
const CSS_VAR_WORD_INDEX = '--word-index';
const CSS_VAR_CHAR_INDEX = '--char-index';
const CSS_VAR_CONTAINER_HEIGHT = '--container-height';
const MEASURING_CLASS = 'ts-measuring';

const canUseDOM = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const resolveContainer = (container?: HTMLElement | string): HTMLElement | null => {
  if (!canUseDOM()) return null;
  if (!container) return null;

  return typeof container === 'string' ? document.querySelector(container) : container;
};

type IntlWithSegmenter = typeof Intl & {
  Segmenter?: new (locales?: string | string[], options?: Intl.SegmenterOptions) => Intl.Segmenter;
};

const splitIntoGraphemes = (text: string): string[] => {
  const Seg = (Intl as IntlWithSegmenter).Segmenter;

  if (typeof Seg === 'function') {
    const segmenter = new Seg('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s: Intl.SegmentData) => s.segment);
  }

  return Array.from(text);
};

const splitIntoWords = (text: string): string[] => text.split(SPACE);

const emptyElement = (el: HTMLElement): void => {
  el.replaceChildren();
};

const isHTMLElement = (el: unknown): el is HTMLElement =>
  !!el && typeof HTMLElement !== 'undefined' && el instanceof HTMLElement;

type NonUndefined<T> = T extends undefined ? never : T;
type OmitUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends undefined ? never : K]: NonUndefined<T[K]>;
};

const omitUndefined = <T extends Record<string, unknown>>(obj: T): OmitUndefined<T> => {
  const out = {} as OmitUndefined<T>;

  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const val = obj[key];

    if (val !== undefined) {
      (out as Record<string, unknown>)[key as string] = val as unknown;
    }
  });

  return out;
};

export class TextSlicer {
  private readonly el: HTMLElement | null;
  private original: string;
  private opts: RuntimeOptions;
  private callbacks: TextSlicerCallbacks | undefined;
  private charIndex: number;
  private mounted: boolean;
  private heightLocked: boolean;
  private resizeObserver?: ResizeObserver;

  constructor(options: TextSlicerOptions = {}, callbacks?: TextSlicerCallbacks) {
    const el = resolveContainer(options.container);
    this.el = el;
    this.original = isHTMLElement(el) ? (el.textContent?.toString() ?? '') : '';
    this.opts = {
      ...DEFAULT_OPTIONS,
      ...omitUndefined<Omit<TextSlicerOptions, 'container'>>(options),
    } as RuntimeOptions;

    this.callbacks = callbacks;
    this.charIndex = 0;
    this.mounted = false;
    this.heightLocked = false;
  }

  get metrics(): TextSlicerMetrics {
    const text = this.original;

    return {
      wordTotal: text.length ? splitIntoWords(text).length : 0,
      charTotal: text.length,
      renderedAt: Date.now(),
    };
  }

  init(): void {
    if (!this.el) return;

    this.mounted = true;
    this.split();

    if (this.opts.containerHeightVar) {
      this.initHeightObserver();
    }
  }

  reinit(newText?: string, next?: Partial<TextSlicerOptions>): void {
    if (!this.el) return;
    if (typeof newText === 'string') this.original = newText;
    if (next) this.opts = { ...this.opts, ...omitUndefined(next) } as RuntimeOptions;

    this.split();
  }

  clear(): void {
    if (!this.el) return;

    emptyElement(this.el);
  }

  split(): void {
    if (!this.el) return;

    this.clear();
    this.charIndex = 0;

    const text = this.original;
    const fragment = document.createDocumentFragment();
    const words = splitIntoWords(text);

    if (this.opts.splitMode === 'chars') {
      this.appendChars(fragment, text);
    } else {
      this.appendWords(fragment, words);
    }

    this.el.appendChild(fragment);

    if (this.opts.cssVariables) {
      this.el.style.setProperty(CSS_VAR_WORD_TOTAL, String(words.length));
      this.el.style.setProperty(CSS_VAR_CHAR_TOTAL, String(text.length));
    }

    this.callbacks?.onAfterRender?.(this.metrics);
  }

  destroy(): void {
    if (!this.el) return;

    this.clear();
    this.unlockHeight();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (this.opts.containerHeightVar) {
      this.el.style.removeProperty(CSS_VAR_CONTAINER_HEIGHT);
    }

    this.mounted = false;
  }

  updateOptions(next: Partial<TextSlicerOptions>): void {
    this.opts = { ...this.opts, ...omitUndefined(next) } as RuntimeOptions;

    if (this.mounted) this.split();
  }

  lockHeight(): void {
    if (!this.el) return;

    const h = this.measureHeight();

    if (h > 0) {
      this.el.style.height = `${h}px`;
      this.heightLocked = true;
    }
  }

  unlockHeight(): void {
    if (!this.el) return;

    this.el.style.removeProperty('height');
    this.heightLocked = false;
  }

  private appendWords(fragment: DocumentFragment, words: string[]): void {
    words.forEach((word, wordIndex) => {
      if (this.opts.splitMode === 'both') {
        const wordSpan = this.createWordSpan(wordIndex, word);

        for (const ch of splitIntoGraphemes(word)) {
          const charSpan = this.createCharSpan(ch);

          wordSpan.append(charSpan);
        }

        fragment.append(wordSpan);
      } else {
        const wordSpan = this.createWordSpan(wordIndex);

        wordSpan.append(document.createTextNode(word));
        fragment.append(wordSpan);
      }

      if (wordIndex < words.length - 1) {
        fragment.append(this.createSpaceSpan());
      }
    });
  }

  private appendChars(fragment: DocumentFragment, text: string): void {
    for (const ch of splitIntoGraphemes(text)) {
      const span = this.createCharSpan(ch);

      fragment.append(span);
    }
  }

  private createWordSpan(index: number, word: string = ''): HTMLSpanElement {
    const span = document.createElement('span');

    span.classList.add(CLASSNAMES.word);

    if (this.opts.dataAttributes && word) {
      span.setAttribute('data-word', word);
    }

    if (this.opts.cssVariables) {
      span.style.setProperty(CSS_VAR_WORD_INDEX, String(index));
    }

    return span;
  }

  private createCharSpan(ch: string): HTMLSpanElement {
    const span = document.createElement('span');

    span.textContent = ch;

    if (this.opts.dataAttributes) span.setAttribute('data-char', ch);

    if (ch === SPACE) {
      span.classList.add(CLASSNAMES.whitespace);

      if (!this.opts.keepWhitespaceNodes) span.textContent = SPACE;
    } else {
      span.classList.add(CLASSNAMES.char);

      if (this.opts.cssVariables) {
        span.style.setProperty(CSS_VAR_CHAR_INDEX, String(this.charIndex));
      }

      this.charIndex += 1;
    }

    return span;
  }

  private createSpaceSpan(): HTMLSpanElement {
    const span = document.createElement('span');

    span.classList.add(CLASSNAMES.whitespace);
    span.textContent = SPACE;

    return span;
  }

  private measureHeight(): number {
    if (!this.el) return 0;

    this.el.classList.add(MEASURING_CLASS);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.el.offsetHeight;

    let h = this.el.offsetHeight || this.el.clientHeight || 0;

    if (!h) {
      h = Math.round(this.el.getBoundingClientRect().height);
    }

    this.el.classList.remove(MEASURING_CLASS);

    return Math.max(0, Math.ceil(h));
  }

  private initHeightObserver(): void {
    if (!this.el) return;

    this.resizeObserver = new ResizeObserver(() => {
      const h = this.measureHeight();

      if (h > 0) {
        this.el!.style.setProperty(CSS_VAR_CONTAINER_HEIGHT, `${h}px`);
      }
    });

    this.resizeObserver.observe(this.el);
  }
}
