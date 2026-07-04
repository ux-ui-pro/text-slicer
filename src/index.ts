export type SplitMode = 'words' | 'chars' | 'both';

export interface TextSlicerOptions {
  container?: HTMLElement | string;
  splitMode?: SplitMode;
  cssVariables?: boolean;
  dataAttributes?: boolean;
  keepWhitespaceNodes?: boolean;
  containerHeightVar?: boolean;
  locale?: string | string[];
}

export interface TextSlicerMetrics {
  wordTotal: number;
  charTotal: number;
  renderedAt: number;
}

export interface TextSlicerCallbacks {
  onAfterRender?: (metrics: TextSlicerMetrics) => void;
}

type RuntimeOptions = Required<Omit<TextSlicerOptions, 'container' | 'locale'>> &
  Pick<TextSlicerOptions, 'locale'>;

const DEFAULT_OPTIONS: RuntimeOptions = {
  splitMode: 'both',
  cssVariables: false,
  dataAttributes: false,
  keepWhitespaceNodes: true,
  containerHeightVar: false,
  locale: undefined,
};

export const CLASSNAMES = Object.freeze({
  word: 'ts-word',
  char: 'ts-char',
  whitespace: 'ts-whitespace',
});

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

const localeKey = (locale: string | string[] | undefined): string =>
  locale === undefined ? '' : Array.isArray(locale) ? locale.join('\0') : locale;

const segmenterCache = new Map<string, Intl.Segmenter>();

const getSegmenter = (
  locale: string | string[] | undefined,
  granularity: 'grapheme' | 'word',
): Intl.Segmenter | null => {
  if (typeof Intl === 'undefined') return null;

  const Seg = (Intl as IntlWithSegmenter).Segmenter;

  if (typeof Seg !== 'function') return null;

  const key = `${granularity}:${localeKey(locale)}`;
  let segmenter = segmenterCache.get(key);

  if (!segmenter) {
    segmenter = new Seg(locale, { granularity });
    segmenterCache.set(key, segmenter);
  }

  return segmenter;
};

const splitIntoGraphemes = (text: string, locale?: string | string[]): string[] => {
  const segmenter = getSegmenter(locale, 'grapheme');

  if (segmenter) {
    return Array.from(segmenter.segment(text), (s: Intl.SegmentData) => s.segment);
  }

  // Fallback: Array.from does not preserve all ZWJ/emoji grapheme clusters.
  // Remove when the browser baseline requires Intl.Segmenter.
  return Array.from(text);
};

const isWhitespaceGrapheme = (ch: string): boolean => /^\s+$/u.test(ch);

const countCharGraphemes = (text: string, locale?: string | string[]): number =>
  splitIntoGraphemes(text, locale).filter((ch) => !isWhitespaceGrapheme(ch)).length;

type WordSegment = Intl.SegmentData;

const segmentWords = (text: string, locale?: string | string[]): WordSegment[] => {
  const segmenter = getSegmenter(locale, 'word');

  if (segmenter) {
    return Array.from(segmenter.segment(text));
  }

  // Fallback: whitespace splitting is not locale-aware and keeps punctuation attached to tokens.
  // Remove when the browser baseline requires Intl.Segmenter.
  const words = text.split(/\s+/u).filter(Boolean);
  const segments: WordSegment[] = [];

  let cursor = 0;

  for (const word of words) {
    const start = text.indexOf(word, cursor);

    if (start > cursor) {
      segments.push({
        segment: text.slice(cursor, start),
        index: cursor,
        input: text,
        isWordLike: false,
      });
    }

    segments.push({ segment: word, index: start, input: text, isWordLike: true });
    cursor = start + word.length;
  }

  if (cursor < text.length) {
    segments.push({ segment: text.slice(cursor), index: cursor, input: text, isWordLike: false });
  }

  return segments;
};

const countWords = (text: string, locale?: string | string[]): number =>
  segmentWords(text, locale).filter((s) => s.isWordLike).length;

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

type RuntimeOptionPatch = Partial<Omit<TextSlicerOptions, 'container'>>;

const mergeRuntimeOptions = (base: RuntimeOptions, patch: RuntimeOptionPatch): RuntimeOptions => {
  const { container: _container, ...runtimeOptions } = patch as TextSlicerOptions;

  return {
    ...base,
    ...omitUndefined(runtimeOptions as Record<string, unknown>),
  };
};

type ManagedStyle = { value: string; priority: string };

export class TextSlicer {
  private readonly el: HTMLElement | null;
  private original: string;
  private opts: RuntimeOptions;
  private callbacks: TextSlicerCallbacks | undefined;
  private charIndex: number;
  private mounted: boolean;
  private resizeObserver?: ResizeObserver;
  private managedStyles = new Map<string, ManagedStyle>();
  private managedAttributes = new Map<string, string | null>();

  constructor(options: TextSlicerOptions = {}, callbacks?: TextSlicerCallbacks) {
    const { container, ...runtimeOptions } = options;
    const el = resolveContainer(container);
    this.el = el;
    // Plain-text mode intentionally discards nested markup. Upgrade path:
    // walk text nodes and preserve element boundaries in a DOM-preserving mode.
    this.original = isHTMLElement(el) ? (el.textContent?.toString() ?? '') : '';
    this.opts = mergeRuntimeOptions(DEFAULT_OPTIONS, runtimeOptions);

    this.callbacks = callbacks;
    this.charIndex = 0;
    this.mounted = false;
  }

  get metrics(): TextSlicerMetrics {
    const text = this.original;
    const { locale } = this.opts;

    return {
      wordTotal: text.length ? countWords(text, locale) : 0,
      charTotal: text.length ? countCharGraphemes(text, locale) : 0,
      renderedAt: Date.now(),
    };
  }

  init(): void {
    if (!this.el) return;

    this.mounted = true;
    this.split();
    this.syncHeightObserver();
  }

  reinit(newText?: string, next?: RuntimeOptionPatch): void {
    if (!this.el) return;
    if (typeof newText === 'string') this.original = newText;
    if (next) this.opts = mergeRuntimeOptions(this.opts, next);

    this.mounted = true;
    this.split();
    this.syncHeightObserver();
  }

  clear(): void {
    if (!this.el) return;

    emptyElement(this.el);
    this.restoreManagedAttribute('aria-label');
  }

  split(): void {
    if (!this.el) return;

    emptyElement(this.el);
    this.charIndex = 0;

    const text = this.original;
    const fragment = document.createDocumentFragment();

    if (this.opts.splitMode === 'chars') {
      this.appendChars(fragment, text);
    } else {
      this.appendWords(fragment, text);
    }

    this.el.appendChild(fragment);
    this.syncAccessibleLabel(text);

    const metrics = this.metrics;

    if (this.opts.cssVariables) {
      this.setManagedStyle(CSS_VAR_WORD_TOTAL, String(metrics.wordTotal));
      this.setManagedStyle(CSS_VAR_CHAR_TOTAL, String(metrics.charTotal));
    } else {
      this.restoreManagedStyle(CSS_VAR_WORD_TOTAL);
      this.restoreManagedStyle(CSS_VAR_CHAR_TOTAL);
    }

    this.callbacks?.onAfterRender?.(metrics);
  }

  destroy(): void {
    if (!this.el) return;

    this.syncHeightObserver(false);
    this.restoreManagedStyles();
    this.restoreManagedAttribute('aria-label');
    this.el.textContent = this.original;
    this.mounted = false;
  }

  updateOptions(next: RuntimeOptionPatch): void {
    this.opts = mergeRuntimeOptions(this.opts, next);

    if (this.mounted) {
      this.split();
      this.syncHeightObserver();
    }
  }

  lockHeight(): void {
    if (!this.el) return;

    const h = this.measureHeight();

    if (h > 0) {
      this.setManagedStyle('height', `${h}px`);
    }
  }

  unlockHeight(): void {
    this.restoreManagedStyle('height');
  }

  private appendWords(fragment: DocumentFragment, text: string): void {
    const segments = segmentWords(text, this.opts.locale);
    let wordIndex = 0;

    for (const { segment, isWordLike } of segments) {
      if (isWordLike) {
        const wordSpan = this.createWordSpan(wordIndex, segment);

        if (this.opts.splitMode === 'both') {
          this.appendGraphemes(wordSpan, segment);
        } else {
          wordSpan.append(document.createTextNode(segment));
        }

        fragment.append(wordSpan);
        wordIndex += 1;
      } else if (isWhitespaceGrapheme(segment)) {
        if (this.opts.splitMode === 'both') {
          this.appendGraphemes(fragment, segment);
        } else {
          fragment.append(this.createWhitespaceSpan(segment));
        }
      } else if (segment.length > 0) {
        if (this.opts.splitMode === 'both') {
          this.appendGraphemes(fragment, segment);
        } else {
          fragment.append(this.createHiddenTextSpan(segment));
        }
      }
    }
  }

  private appendChars(fragment: DocumentFragment, text: string): void {
    for (const ch of splitIntoGraphemes(text, this.opts.locale)) {
      this.appendGrapheme(fragment, ch);
    }
  }

  private appendGraphemes(parent: DocumentFragment | HTMLElement, text: string): void {
    for (const ch of splitIntoGraphemes(text, this.opts.locale)) {
      this.appendGrapheme(parent, ch);
    }
  }

  private appendGrapheme(parent: DocumentFragment | HTMLElement, ch: string): void {
    if (isWhitespaceGrapheme(ch)) {
      if (this.opts.keepWhitespaceNodes) {
        parent.append(this.createWhitespaceSpan(ch));
      } else {
        parent.append(document.createTextNode(ch));
      }

      return;
    }

    parent.append(this.createCharSpan(ch));
  }

  private createWordSpan(index: number, word: string): HTMLSpanElement {
    const span = document.createElement('span');

    span.classList.add(CLASSNAMES.word);
    span.setAttribute('aria-hidden', 'true');

    if (this.opts.dataAttributes) {
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
    span.setAttribute('aria-hidden', 'true');
    span.classList.add(CLASSNAMES.char);

    if (this.opts.dataAttributes) span.setAttribute('data-char', ch);

    if (this.opts.cssVariables) {
      span.style.setProperty(CSS_VAR_CHAR_INDEX, String(this.charIndex));
    }

    this.charIndex += 1;

    return span;
  }

  private createWhitespaceSpan(text: string): HTMLSpanElement {
    const span = document.createElement('span');

    span.classList.add(CLASSNAMES.whitespace);
    span.textContent = text;
    span.setAttribute('aria-hidden', 'true');

    return span;
  }

  private createHiddenTextSpan(text: string): HTMLSpanElement {
    const span = document.createElement('span');

    span.textContent = text;
    span.setAttribute('aria-hidden', 'true');

    return span;
  }

  private syncAccessibleLabel(text: string): void {
    if (!this.el) return;

    if (this.managedAttributes.has('aria-label')) {
      this.setManagedAttribute('aria-label', text);
      return;
    }

    if (this.el.hasAttribute('aria-label') || this.el.hasAttribute('aria-labelledby')) {
      return;
    }

    this.setManagedAttribute('aria-label', text);
  }

  private measureHeight(): number {
    if (!this.el) return 0;

    this.el.classList.add(MEASURING_CLASS);

    try {
      void this.el.offsetHeight;

      let h = this.el.offsetHeight || this.el.clientHeight || 0;

      if (!h) {
        h = Math.round(this.el.getBoundingClientRect().height);
      }

      return Math.max(0, Math.ceil(h));
    } finally {
      this.el.classList.remove(MEASURING_CLASS);
    }
  }

  private syncHeightObserver(enable: boolean = this.opts.containerHeightVar): void {
    if (!this.el) return;

    if (enable) {
      if (typeof ResizeObserver !== 'function') {
        this.restoreManagedStyle(CSS_VAR_CONTAINER_HEIGHT);
        return;
      }

      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];

          if (!entry || !this.el) return;

          const boxSize = entry.borderBoxSize?.[0]?.blockSize;
          const h = Math.max(0, Math.ceil(boxSize ?? entry.contentRect.height));

          if (h > 0) {
            this.setManagedStyle(CSS_VAR_CONTAINER_HEIGHT, `${h}px`);
          }
        });

        this.resizeObserver.observe(this.el);
      }
    } else if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
      this.restoreManagedStyle(CSS_VAR_CONTAINER_HEIGHT);
    }
  }

  private setManagedStyle(property: string, value: string): void {
    if (!this.el) return;

    if (!this.managedStyles.has(property)) {
      this.managedStyles.set(property, {
        value: this.el.style.getPropertyValue(property),
        priority: this.el.style.getPropertyPriority(property),
      });
    }

    this.el.style.setProperty(property, value);
  }

  private restoreManagedStyle(property: string): void {
    if (!this.el) return;

    const previous = this.managedStyles.get(property);

    if (previous === undefined) return;

    if (previous.value) {
      this.el.style.setProperty(property, previous.value, previous.priority);
    } else {
      this.el.style.removeProperty(property);
    }

    this.managedStyles.delete(property);
  }

  private restoreManagedStyles(): void {
    for (const property of [...this.managedStyles.keys()]) {
      this.restoreManagedStyle(property);
    }
  }

  private setManagedAttribute(name: string, value: string): void {
    if (!this.el) return;

    if (!this.managedAttributes.has(name)) {
      this.managedAttributes.set(name, this.el.getAttribute(name));
    }

    this.el.setAttribute(name, value);
  }

  private restoreManagedAttribute(name: string): void {
    if (!this.el || !this.managedAttributes.has(name)) return;

    const previous = this.managedAttributes.get(name);

    if (previous === null) {
      this.el.removeAttribute(name);
    } else if (previous !== undefined) {
      this.el.setAttribute(name, previous);
    }

    this.managedAttributes.delete(name);
  }
}
