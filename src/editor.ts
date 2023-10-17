import {Highlights} from "./highlight/highlights";

type Cursor = {
    line1: number,
    key1: number,
    line2: number,
    key2: number
};

export function Editor(editor: HTMLDivElement) {
    const syntax = new Highlights[".ts"]();
    editor.innerHTML = `<div class="cursor blink"></div>
<div class="selection"></div>
<div class="lines"></div>
<div class="code"></div>
<div class="scroll-x"><div class="scroll-x-p"></div></div>
<div class="scroll-y"><div class="scroll-y-p"></div></div>`;
    const cursorDiv = <HTMLDivElement>document.querySelector(".cursor");
    const selectionDiv = <HTMLDivElement>document.querySelector(".selection");
    const linesDiv = <HTMLDivElement>editor.querySelector(".lines");
    const codeDiv = <HTMLDivElement>editor.querySelector(".code");
    const scrollXDiv = <HTMLDivElement>editor.querySelector(".scroll-x");
    const scrollXPos = <HTMLDivElement>editor.querySelector(".scroll-x-p");
    const scrollYDiv = <HTMLDivElement>editor.querySelector(".scroll-y");
    const scrollYPos = <HTMLDivElement>editor.querySelector(".scroll-y-p");

    let isFocusing = false;
    let isMouseDown = false;
    const CW = 8.88;
    const CH = 19;
    let cursor: Cursor = {
        line1: 0,
        key1: 0,
        line2: 0,
        key2: 0
    };
    const scrollData = {
        x: 0,
        y: 0
    };
    const history: { code: string[], cursor: Cursor }[] = [];
    let historyIndex = -1;
    let saveHistoryTimeout: any;

    function translateToCode(key: number, line: number) {
        return (linesDiv.getBoundingClientRect().width + key * CW + 0.5) + "px " + (line * CH + 1.5) + "px";
    }

    function makeSelectionBox(key: number, line: number, width: number) {
        return `<div style="translate: ${translateToCode(key, line)}; width: ${width * CW}px"></div>`;
    }

    function trySaveHistory() {
        clearTimeout(saveHistoryTimeout);
        saveHistoryTimeout = setTimeout(() => {
            const obj = {code: [...code], cursor: {...cursor}};
            if (JSON.stringify(obj) === JSON.stringify(history[historyIndex])) return;
            history.splice(historyIndex + 1, 0, obj);
            historyIndex++;
        });
    }

    function setHistoryIndex(index: number) {
        historyIndex = index;
        const now = history[historyIndex];
        if (!now) return;
        code = [...now.code];
        codeDiv.innerHTML = `<div class="line"></div>`.repeat(code.length);
        for (let i = 0; i < code.length; i++) {
            updateLineFormat(i, true);
        }
        cursor = {...now.cursor};
        updateLineList();
        updateCursorPosition(true);
    }

    function getCodeBetween(key1: number, line1: number, key2: number, line2: number) {
        if (line1 === line2) {
            return code[line1].substring(Math.min(key1, key2), Math.max(key1, key2))
        }
        let c = "";
        if (line1 > line2) {
            let tmp = line2;
            line2 = line1;
            line1 = tmp;
            tmp = key2;
            key2 = key1;
            key1 = tmp;
        }
        c += code[line1].substring(key1) + "\n";
        for (let i = line1 + 1; i < line2; i++) {
            c += code[i] + "\n";
        }
        c += code[line2].substring(0, key2);
        return c;
    }

    function updateCursorPosition(noLoop = false) {
        if (!noLoop) trySaveHistory();
        cursorDiv.style.translate = translateToCode(cursor.key2, cursor.line2);
        if (!hasSelection()) {
            selectionDiv.innerHTML = "";
            return;
        }
        let selHTML = "";
        if (cursor.line1 === cursor.line2) {
            const kMin = Math.min(cursor.key1, cursor.key2);
            const kMax = Math.max(cursor.key1, cursor.key2);
            selHTML = makeSelectionBox(kMin, cursor.line1, kMax - kMin);
        } else {
            const lMin = Math.min(cursor.line1, cursor.line2);
            const lMax = Math.max(cursor.line1, cursor.line2);
            let k1 = lMin === cursor.line1 ? cursor.key1 : cursor.key2;
            let k2 = lMin === cursor.line2 ? cursor.key1 : cursor.key2;
            selHTML += makeSelectionBox(k1, lMin, code[lMin].length - k1);
            for (let line = lMin + 1; line < lMax; line++) {
                if (code[line].length > 0) selHTML += makeSelectionBox(0, line, code[line].length);
            }
            if (cursor.line1 !== cursor.line2) {
                selHTML += makeSelectionBox(0, lMax, k2);
            }
        }
        selectionDiv.innerHTML = selHTML;
    }

    function setFocus(value: boolean) {
        if (isFocusing === value) return;
        isFocusing = value;
        cursorDiv.hidden = !isFocusing;
        if (!isFocusing) isMouseDown = false;
        updateCursorPosition();
    }

    function updateLineList() {
        let lineListStr = "";
        for (let i = 0; i < code.length; i++) lineListStr += `<div>${i + 1}</div>`;
        linesDiv.innerHTML = lineListStr;
    }

    function updateLineFormat(index: number, noLoop = false) {
        if (!noLoop) trySaveHistory();
        updateScroll();
        updateSyntaxHighlighting();
        return;
        const line = <HTMLDivElement>codeDiv.children[index];
        let html = "";
        const content = code[index];
        const tokens = syntax.paint(content);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            html += `<span${token.color ? ` style="color:${token.color}"` : ""}>${token.text === " " ? "&nbsp;" : token.text}</span>`;
        }
        line.innerHTML = html;
    }

    function updateSyntaxHighlighting() {
        const tokens = syntax.paint(code.join("\n"));
        console.log(tokens);
        let lineIndex = 0;
        let line = <HTMLDivElement>codeDiv.children[0];
        let html = "";
        for (let i = 0; i <= tokens.length; i++) {
            const token = tokens[i];
            if (!token || token.text === "\n") {
                line.innerHTML = html;
                lineIndex++;
                line = <HTMLDivElement>codeDiv.children[lineIndex];
                html = "";
                continue;
            }
            html += `<span${token.color ? ` style="color:${token.color}"` : ""}>${token.text === " " ? "&nbsp;" : token.text}</span>`;
        }
    }

    function moveToCursor() {
        // todo
    }

    function writeText(text: string) {
        if (hasSelection()) eraseSelectedCode();
        const lines = text.split("\n");

        const lineCode = code[cursor.line1];
        code[cursor.line1] = lineCode.substring(0, cursor.key1) + lines[0];
        updateLineFormat(cursor.line1);
        if (lines.length === 1) {
            cursor.key1 = cursor.key2 += lines[0].length;
        } else {
            const lastLine = lines[lines.length - 1];
            if (!code[cursor.line1 + 1]) {
                const div = document.createElement("div");
                div.classList.add("line");
                codeDiv.children[cursor.line1].insertAdjacentElement("afterend", div);
            }
            code[cursor.line1 + 1] = lastLine + lineCode.substring(cursor.key1);
            code.splice(cursor.line1 + 1, 0, ...new Array(lines.length - 2).fill(""));
            for (let i = 0; i < lines.length - 2; i++) { // -2 is because we already can do the first and last
                const div = document.createElement("div");
                div.classList.add("line");
                if (i === 0) codeDiv.children[cursor.line1].insertAdjacentElement("afterend", div);
                else codeDiv.appendChild(div);
                code[cursor.line1 + i + 1] = lines[i + 1];
                updateLineFormat(cursor.line1 + i + 1);
            }
            updateLineFormat(cursor.line1 + lines.length - 1);
            cursor.key1 = cursor.key2 = lastLine.length;
            cursor.line1 = cursor.line2 += lines.length - 1;
        }
        updateLineList();
        updateCursorPosition();
        moveToCursor();
    }

    function __rawWriteChar(key: string) {
        const lineCode = code[cursor.line1];
        code[cursor.line1] = lineCode.substring(0, cursor.key1) + key + lineCode.substring(cursor.key1);
    }

    function writeChar(key: string) {
        if (hasSelection()) eraseSelectedCode();
        __rawWriteChar(key);
        cursor.key1 = ++cursor.key2;
        updateLineFormat(cursor.line1);
        updateCursorPosition();
    }

    function pressEnter() {
        if (hasSelection()) eraseSelectedCode();
        let startSpace = 0;
        const lineCode = code[cursor.line1];
        for (let i = 0; i < lineCode.length; i++) {
            if (lineCode[i] === " ") startSpace++;
            else break;
        }
        const div = document.createElement("div");
        div.classList.add("line");
        const currentLine = codeDiv.children[cursor.line1];
        if (currentLine) currentLine.insertAdjacentElement("afterend", div);
        else codeDiv.appendChild(div);
        code.splice(cursor.line1 + 1, 0, "");
        code[cursor.line1] = lineCode.substring(0, cursor.key1);
        code[cursor.line1 + 1] = " ".repeat(startSpace) + lineCode.substring(cursor.key1);
        cursor.line1 = ++cursor.line2;
        cursor.key1 = startSpace;
        cursor.key2 = startSpace;
        updateLineFormat(cursor.line1 - 1);
        updateLineFormat(cursor.line1);
        updateLineList();
        updateCursorPosition();
        moveToCursor();
    }

    function hasSelection() {
        return cursor.key1 !== cursor.key2 || cursor.line1 !== cursor.line2;
    }

    function putSelectionToStart() {
        if (cursor.line1 === cursor.line2) {
            cursor.key1 = cursor.key2 = Math.min(cursor.key1, cursor.key2);
            updateCursorPosition();
            return;
        }
        if (cursor.line1 > cursor.line2) {
            cursor.key1 = cursor.key2;
            cursor.line1 = cursor.line2;
        } else {
            cursor.key2 = cursor.key1;
            cursor.line2 = cursor.line1;
        }
        updateCursorPosition();
    }

    function putSelectionToEnd() {
        if (cursor.line1 === cursor.line2) {
            cursor.key1 = cursor.key2 = Math.max(cursor.key1, cursor.key2);
            updateCursorPosition();
            return;
        }
        if (cursor.line1 < cursor.line2) {
            cursor.key1 = cursor.key2;
            cursor.line1 = cursor.line2;
        } else {
            cursor.key2 = cursor.key1;
            cursor.line2 = cursor.line1;
        }
        updateCursorPosition();
    }

    function doKeyLimits() {
        if (cursor.key1 < 0) cursor.key1 = 0;
        if (cursor.key2 < 0) cursor.key2 = 0;
        if (cursor.key1 > code[cursor.line1].length) cursor.key1 = code[cursor.line1].length;
        if (cursor.key2 > code[cursor.line2].length) cursor.key2 = code[cursor.line2].length;
        if (cursor.line1 < 0) cursor.line1 = 0;
        if (cursor.line2 < 0) cursor.line2 = 0;
        if (cursor.line1 > code.length - 1) cursor.line1 = code.length - 1;
        if (cursor.line2 > code.length - 1) cursor.line2 = code.length - 1;
        updateCursorPosition();
    }

    function eraseSelectedCode() {
        if (cursor.line1 === cursor.line2) {
            const kMin = Math.min(cursor.key1, cursor.key2);
            const kMax = Math.max(cursor.key1, cursor.key2);
            const lineCode = code[cursor.line1];
            code[cursor.line1] = lineCode.substring(0, kMin) + lineCode.substring(kMax);
            cursor.key1 = cursor.key2 = kMin;
            updateLineFormat(cursor.line1);
            doKeyLimits();
            return;
        }
        const lMin = Math.min(cursor.line1, cursor.line2);
        const lMax = Math.max(cursor.line1, cursor.line2);
        const k1 = lMin === cursor.line1 ? cursor.key1 : cursor.key2;
        const k2 = lMin === cursor.line2 ? cursor.key1 : cursor.key2;
        code.splice(lMin + 1, lMax - lMin - 1);
        [...codeDiv.children].slice(lMin + 1, lMax).forEach(i => i.remove());
        code[lMin] = code[lMin].substring(0, k1) + code[lMin + 1].substring(k2);
        code.splice(lMin + 1, 1);
        codeDiv.children[lMin + 1].remove();
        updateLineFormat(lMin);
        updateLineList();
        cursor.key1 = cursor.key2 = k1;
        cursor.line1 = cursor.line2 = lMin;
        doKeyLimits();
    }

    function updateScroll() {
        const rect = editor.getBoundingClientRect();

        let maxScrollX = 0;
        for (let i = 0; i < code.length; i++) {
            const l = code[i].length * CW;
            if (l > maxScrollX) maxScrollX = l;
        }
        let maxScrollY = code.length * CH - rect.height;

        if (maxScrollX < rect.width) maxScrollX = 0;
        if (maxScrollY + rect.height < rect.height) maxScrollY = 0;

        if (scrollData.x < 0) scrollData.x = 0;
        if (scrollData.x > maxScrollX) scrollData.x = maxScrollX;

        if (scrollData.y < 0) scrollData.y = 0;
        if (scrollData.y > maxScrollY) scrollData.y = maxScrollY;

        scrollXDiv.hidden = maxScrollX === 0;
        if (maxScrollX) {
            const scrollXOnce = `calc(calc(100% - 20px) / 100 * ${Math.floor(maxScrollX / 100)})`;
            const scrollXPercent = Math.floor((scrollData.x / maxScrollX) * 100);
            scrollXDiv.style.bottom = 5 - scrollData.y + "px";
            scrollXDiv.style.left = 5 + scrollData.x + "px";
            scrollXPos.style.left = `calc(calc(100% - ${scrollXOnce}) / 100 * ${scrollXPercent})`;
            scrollXPos.style.width = scrollXOnce;
        }

        scrollYDiv.hidden = maxScrollY === 0;
        if (maxScrollY) {
            const scrollYOnce = `calc(calc(100% - 20px) / 100 * ${Math.floor(maxScrollY / 100)})`;
            const scrollYPercent = Math.floor((scrollData.y / maxScrollY) * 100);
            scrollYDiv.style.right = 5 - scrollData.x + "px";
            scrollYDiv.style.top = 5 + scrollData.y + "px";
            scrollYPos.style.top = `calc(calc(100% - ${scrollYOnce}) / 100 * ${scrollYPercent})`;
            scrollYPos.style.height = scrollYOnce;
        }

        editor.scrollTop = scrollData.y;
        codeDiv.scrollLeft = scrollData.x;
        if (editor.scrollTop < scrollData.y) {
            scrollData.y = editor.scrollTop;
            updateScroll();
        }
        if (editor.scrollLeft < scrollData.x) {
            scrollData.x = editor.scrollLeft;
            updateScroll();
        }
    }

    function doScroll(x: number, y: number) {
        scrollData.x = Math.floor(scrollData.x + x);
        scrollData.y = Math.floor(scrollData.y + y);
        updateScroll();
    }

    linesDiv.innerHTML = "1";
    cursorDiv.hidden = true;
    let code: string[] = [""];
    for (let i = 0; i < code.length; i++) {
        codeDiv.innerHTML += `<div class="line"></div>`;
        updateLineList();
        updateLineFormat(i);
    }
    updateCursorPosition();
    addEventListener("blur", () => setFocus(false));
    addEventListener("mousedown", e => {
        setFocus(e.composedPath().includes(codeDiv));
    });

    const CustomKeys: Record<string, (event: KeyboardEvent) => void> = {
        Enter(event: KeyboardEvent) {
            pressEnter();
        },
        Delete(event: KeyboardEvent) {
            if (hasSelection()) return eraseSelectedCode();
            if (cursor.key1 === code[cursor.line1].length) {
                if (cursor.line1 === code.length - 1) return;
                const removedLine = code[cursor.line1];
                code.splice(cursor.line1 + 1, 1);
                codeDiv.children[cursor.line1 + 1].remove();
                code[cursor.line1] += removedLine;
                updateLineFormat(cursor.line1);
                updateLineList();
                return;
            }
            const lineCode = code[cursor.line1];
            let amount = 0;
            if (event.ctrlKey) {
                let f = false;
                for (let i = cursor.key1; i < lineCode.length; i++) {
                    const char = lineCode[i];
                    if (char !== " ") f = true;
                    if (char === " " && f) break;
                    amount++;
                }
            } else amount = 1;
            code[cursor.line1] = code[cursor.line2] = lineCode.substring(0, cursor.key1) + lineCode.substring(cursor.key1 + amount);
            updateLineFormat(cursor.line1);
        },
        Backspace(event: KeyboardEvent) {
            if (hasSelection()) return eraseSelectedCode();
            if (cursor.key1 === 0) {
                if (cursor.line1 === 0) return;
                const removedLine = code[cursor.line1];
                code.splice(cursor.line1, 1);
                codeDiv.children[cursor.line1].remove();
                cursor.line1 = --cursor.line2;
                cursor.key1 = cursor.key2 = code[cursor.line1].length;
                code[cursor.line1] += removedLine;
                updateLineFormat(cursor.line1);
                updateLineList();
                updateCursorPosition();
                return;
            }
            const lineCode = code[cursor.line1];
            let amount = 0;
            if (event.ctrlKey) {
                let f = false;
                for (let i = cursor.key1 - 1; i >= 0; i--) {
                    const char = lineCode[i];
                    if (char !== " ") f = true;
                    if (char === " " && f) break;
                    amount++;
                }
            } else amount = 1;
            code[cursor.line1] = code[cursor.line2] = lineCode.substring(0, cursor.key1 - amount) + lineCode.substring(cursor.key1);
            updateLineFormat(cursor.line1);
            cursor.key1 = cursor.key2 -= amount;
            updateCursorPosition();
        },
        ArrowRight(event: KeyboardEvent) {
            event.preventDefault();
            if (!event.shiftKey && hasSelection()) return putSelectionToEnd();
            cursor.key2++;
            if (!event.shiftKey) cursor.key1 = cursor.key2;
            if (cursor.key1 > code[cursor.line1].length && cursor.line1 < code.length - 1) {
                cursor.line2++;
                cursor.key2 = 0;
                if (!event.shiftKey) {
                    cursor.line1 = cursor.line2;
                    cursor.key1 = 0;
                }
            }
            doKeyLimits();
        },
        ArrowLeft(event: KeyboardEvent) {
            event.preventDefault();
            if (!event.shiftKey && hasSelection()) return putSelectionToStart();
            cursor.key2--;
            if (!event.shiftKey) cursor.key1 = cursor.key2;
            if (cursor.key1 < 0 && cursor.line1 > 0) {
                cursor.line2--;
                cursor.key2 = Infinity; // this will make it will go to the end of that line
                if (!event.shiftKey) {
                    cursor.key1 = Infinity;
                    cursor.line1 = cursor.line2;
                }
            }
            doKeyLimits();
        },
        ArrowUp(event: KeyboardEvent) {
            event.preventDefault();
            if (event.ctrlKey) {
                doScroll(0, -CH);
                return;
            }
            if (!event.shiftKey && hasSelection()) putSelectionToEnd();
            if (cursor.line1 === 0) {
                cursor.key1 = 0;
                if (!event.shiftKey) cursor.key2 = 0;
                updateCursorPosition();
                return;
            }
            cursor.line2--;
            if (!event.shiftKey) cursor.line1 = cursor.line2;
            doKeyLimits();
        },
        ArrowDown(event: KeyboardEvent) {
            event.preventDefault();
            if (event.ctrlKey) {
                doScroll(0, CH);
                return;
            }
            if (!event.shiftKey && hasSelection()) putSelectionToEnd();
            if (cursor.line1 >= code.length - 1) {
                cursor.key2 = code[cursor.line1].length;
                if (!event.shiftKey) cursor.key1 = cursor.key2;
                updateCursorPosition();
                return;
            }
            cursor.line2++;
            if (!event.shiftKey) cursor.line1 = cursor.line2;
            doKeyLimits();
        },
        Tab(event: KeyboardEvent) {
            event.preventDefault();
            writeChar(" ");
            writeChar(" ");
            writeChar(" ");
            writeChar(" ");
        },
        Escape(event: KeyboardEvent) {
            event.preventDefault();
            cursor.key1 = cursor.key2;
            cursor.line1 = cursor.line2;
            updateCursorPosition();
        }
    };
    const ModifierCombinations: Record<string, (event: KeyboardEvent) => void> = {
        "control-a"(event: KeyboardEvent) {
            cursor.line1 = cursor.key1 = 0;
            cursor.key2 = code[cursor.line2 = code.length - 1].length;
            updateCursorPosition();
        },
        async "control-c"(event: KeyboardEvent) {
            const text = getCodeBetween(cursor.key1, cursor.line1, cursor.key2, cursor.line2);
            await navigator.clipboard.writeText(text);
        },
        async "control-v"(event: KeyboardEvent) {
            const text = await navigator.clipboard.readText().catch(() => "");
            writeText(text.replaceAll("\r\n", "\n"));
        },
        "control-z"(event: KeyboardEvent) {
            if (historyIndex === 0) return;
            setHistoryIndex(historyIndex - 1);
        },
        "control-y"(event: KeyboardEvent) {
            if (historyIndex === history.length - 1) return;
            setHistoryIndex(historyIndex + 1);
        }
    };
    const IgnoredKeys = [
        "Alt", "Shift", "Control", "Meta",
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
        "CapsLock", "Unidentified", "AltGraph"
    ];
    addEventListener("keydown", e => {
        if (!isFocusing) return;
        if (IgnoredKeys.includes(e.key)) return;
        if (e.key in CustomKeys) {
            return CustomKeys[e.key](e);
        }
        if (e.key.length !== 1) {
            return console.log("Unregistered key: " + e.key);
        }
        let modifierName = "";
        if (e.ctrlKey) modifierName += "control-";
        if (e.altKey) modifierName += "alt-";
        if (e.shiftKey) modifierName += "shift-";
        if (e.metaKey) modifierName += "meta-";
        modifierName += e.key;
        const modifier = ModifierCombinations[modifierName];
        if (modifier) return modifier(e);
        e.preventDefault();
        writeChar(e.key);
        trySaveHistory();
    });

    function getMousePosition(e: MouseEvent) {
        const rect = codeDiv.getBoundingClientRect();
        const y = Math.max(0, Math.min(code.length - 1, Math.floor((e.clientY - rect.y) / CH)));
        const x = Math.max(0, Math.min(code[y].length, Math.round((e.clientX - rect.x) / CW)));
        return {x, y};
    }

    function mouseEventCommon(e: MouseEvent, f: boolean) {
        const {x, y} = getMousePosition(e);
        cursor.key2 = x;
        cursor.line2 = y;
        if (f) {
            cursor.key1 = x;
            cursor.line1 = y;
        }
        updateCursorPosition();
    }

    codeDiv.addEventListener("mousedown", e => {
        isMouseDown = true;
        mouseEventCommon(e, true);
    });
    codeDiv.addEventListener("dblclick", e => {
        const {x, y} = getMousePosition(e);
        const groups = syntax.tokenize(code[y]);
        for (let i = 0, j = 0; i < groups.length; i++) {
            const group = groups[i];
            j += group.text.length;
            if (j >= x) {
                j -= group.text.length;
                cursor.line1 = cursor.line2 = y;
                cursor.key1 = j;
                cursor.key2 = j + group.text.length;
                updateCursorPosition();
                return;
            }
        }
    });
    addEventListener("mousemove", e => {
        if (!isMouseDown) return;
        mouseEventCommon(e, false);
    });
    addEventListener("mouseup", () => {
        if (!isMouseDown) return;
        isMouseDown = false;
    });
    editor.addEventListener("wheel", e => {
        e.preventDefault();
        doScroll(e.deltaX, e.deltaY);
    });
    updateScroll();

    return {
        get history() {
            return history;
        },
        get historyIndex() {
            return historyIndex;
        },
        get cursor() {
            return cursor;
        },
        get code() {
            return code;
        }
    };
}