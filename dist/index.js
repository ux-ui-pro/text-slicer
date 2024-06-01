
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", function () { return $a196c1ed25598f0e$export$2e2bcd8739ae039; });
class $a196c1ed25598f0e$var$TextSlicer {
    constructor(options = {}){
        this.textElement = options.container instanceof HTMLElement ? options.container : document.querySelector(options.container || ".text-slicer");
        if (!this.textElement) {
            this.originalText = "";
            this.splitMode = "both";
            this.cssVariables = false;
            this.dataAttributes = false;
            this.charIndexCounter = 0;
            return;
        }
        this.originalText = this.textElement.textContent?.trim() || "";
        this.splitMode = options.splitMode || "both";
        this.cssVariables = options.cssVariables || false;
        this.dataAttributes = options.dataAttributes || false;
        this.charIndexCounter = 0;
    }
    split() {
        if (!this.textElement) return;
        this.clear();
        this.charIndexCounter = 0;
        const fragment = document.createDocumentFragment();
        const words = this.originalText.split(" ");
        const charCount = this.originalText.length;
        if (this.splitMode === "words" || this.splitMode === "both") this.splitWords(fragment, words);
        else if (this.splitMode === "chars") this.splitChars(fragment);
        this.textElement.appendChild(fragment);
        if (this.cssVariables) {
            this.textElement.style.setProperty("--word-total", words.length.toString());
            this.textElement.style.setProperty("--char-total", charCount.toString());
        }
    }
    splitWords(fragment, words) {
        words.forEach((word, wordIndex)=>{
            if (this.splitMode === "both") {
                const wordSpan = this.createWordSpan(wordIndex, word);
                word.split("").forEach((char)=>{
                    const charSpan = this.createCharSpan(char);
                    wordSpan.append(charSpan);
                });
                fragment.append(wordSpan);
            } else {
                const wordSpan = this.createWordSpan(wordIndex);
                wordSpan.append(document.createTextNode(word));
                fragment.append(wordSpan);
            }
            if (wordIndex < words.length - 1) fragment.append($a196c1ed25598f0e$var$TextSlicer.createSpaceSpan());
        });
    }
    splitChars(fragment) {
        this.originalText.split("").forEach((char)=>{
            const charSpan = this.createCharSpan(char);
            fragment.append(charSpan);
        });
    }
    createWordSpan(index, word = "") {
        const wordSpan = document.createElement("span");
        wordSpan.classList.add("word");
        if (this.dataAttributes) wordSpan.setAttribute("data-word", word);
        if (this.cssVariables) wordSpan.style.setProperty("--word-index", index.toString());
        return wordSpan;
    }
    createCharSpan(char) {
        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        if (this.dataAttributes) charSpan.setAttribute("data-char", char);
        if (char === " ") charSpan.classList.add("whitespace");
        else {
            charSpan.classList.add("char");
            if (this.cssVariables) charSpan.style.setProperty("--char-index", this.charIndexCounter.toString());
            this.charIndexCounter += 1;
        }
        return charSpan;
    }
    static createSpaceSpan() {
        const spaceSpan = document.createElement("span");
        spaceSpan.classList.add("whitespace");
        spaceSpan.textContent = " ";
        return spaceSpan;
    }
    clear() {
        if (this.textElement) this.textElement.innerHTML = "";
    }
    init() {
        this.split();
    }
}
var $a196c1ed25598f0e$export$2e2bcd8739ae039 = $a196c1ed25598f0e$var$TextSlicer;


//# sourceMappingURL=index.js.map
