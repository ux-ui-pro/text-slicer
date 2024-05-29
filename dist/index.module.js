class $fe8af0fdf983f603$var$TextSlicer {
    #textElement;
    #originalText;
    #splitMode;
    #cssVariables;
    #charIndexCounter;
    /**
   * @param {Object} options - Configuration options for the TextSlicer.
   * @param {HTMLElement|string} [options.container] - The container element or a selector for the text to split.
   * @param {string} [options.mode='both'] - The split mode, can be 'words', 'chars', or 'both'.
   * @param {boolean} [options.cssVariables=false] - Whether to use CSS variables for indices.
   */ constructor(options = {}){
        this.#textElement = options.container instanceof HTMLElement ? options.container : document.querySelector(options.container || ".text-splitter");
        if (!this.#textElement) return;
        this.#originalText = this.#textElement.textContent.trim();
        this.#splitMode = options.mode || "both";
        this.#cssVariables = options.cssVariables || false;
        this.#charIndexCounter = 1;
    }
    split() {
        if (!this.#textElement) return;
        this.#clear();
        this.#charIndexCounter = 1;
        const fragment = document.createDocumentFragment();
        if (this.#splitMode === "words" || this.#splitMode === "both") this.#splitWords(fragment);
        else if (this.#splitMode === "chars") this.#splitChars(fragment);
        this.#textElement.appendChild(fragment);
    }
    #splitWords(fragment) {
        const words = this.#originalText.split(" ");
        words.forEach((word, wordIndex)=>{
            if (this.#splitMode === "both") {
                const wordSpan = this.#createWordSpan(wordIndex + 1);
                word.split("").forEach((char)=>{
                    const charSpan = this.#createCharSpan(char);
                    wordSpan.append(charSpan);
                });
                fragment.append(wordSpan);
            } else {
                const wordSpan = this.#createWordSpan(wordIndex + 1, word);
                fragment.append(wordSpan);
            }
            if (wordIndex < words.length - 1) fragment.append($fe8af0fdf983f603$var$TextSlicer.#createSpaceSpan());
        });
    }
    #splitChars(fragment) {
        this.#originalText.split("").forEach((char)=>{
            const charSpan = this.#createCharSpan(char);
            fragment.append(charSpan);
        });
    }
    #createWordSpan(index, textContent = "") {
        const wordSpan = document.createElement("span");
        wordSpan.classList.add("word");
        wordSpan.textContent = textContent;
        if (this.#cssVariables) wordSpan.style.setProperty("--word-index", index);
        return wordSpan;
    }
    #createCharSpan(char) {
        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        if (char === " ") charSpan.classList.add("whitespace");
        else {
            charSpan.classList.add("char");
            if (this.#cssVariables) charSpan.style.setProperty("--char-index", this.#charIndexCounter);
            this.#charIndexCounter += 1;
        }
        return charSpan;
    }
    static #createSpaceSpan() {
        const spaceSpan = document.createElement("span");
        spaceSpan.classList.add("whitespace");
        spaceSpan.textContent = " ";
        return spaceSpan;
    }
    #clear() {
        this.#textElement.innerHTML = "";
    }
    init() {
        this.split();
    }
}
var $fe8af0fdf983f603$export$2e2bcd8739ae039 = $fe8af0fdf983f603$var$TextSlicer;


export {$fe8af0fdf983f603$export$2e2bcd8739ae039 as default};
//# sourceMappingURL=index.module.js.map
