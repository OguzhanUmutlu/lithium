import {tokenizeJS} from "./tokenizer";

export function Editor(editor: HTMLDivElement) {
    const cursorDiv = <HTMLDivElement>document.querySelector(".cursor");
    const selectionDiv = <HTMLDivElement>document.querySelector(".selection");
    const linesDiv = <HTMLDivElement>editor.querySelector(".lines");
    const codeDiv = <HTMLDivElement>editor.querySelector(".code");

    let isFocusing = false;
    let isMouseDown = false;
    const CW = 8.88;
    const CH = 19;
    const cursor = {
        line1: 0,
        key1: 0,
        line2: 0,
        key2: 0
    };

    function translateToCode(key: number, line: number) {
        return (linesDiv.getBoundingClientRect().width + key * CW + 0.5) + "px " + (line * CH + 1.5) + "px";
    }

    function translateSelection(key: number, line: number) {
        return `<div style="translate: ${translateToCode(key, line)}; width: ${(code[line].length - key) * CW}px"></div>`;
    }

    function updateCursorPosition() {
        cursorDiv.style.translate = translateToCode(cursor.key2, cursor.line2);
        if (!hasSelection()) {
            selectionDiv.innerHTML = "";
            return;
        }
        let selHTML = "";
        if (cursor.line1 === cursor.line2) {
            const kMin = Math.min(cursor.key1, cursor.key2);
            const kMax = Math.max(cursor.key1, cursor.key2);
            selHTML = `<div style="translate: ${translateToCode(kMin, cursor.line1)}; width: ${(kMax - kMin) * CW}px"></div>`;
        } else {
            const lMin = Math.min(cursor.line1, cursor.line2);
            const lMax = Math.max(cursor.line1, cursor.line2);
            let k1 = lMin === cursor.line1 ? cursor.key1 : cursor.key2;
            let k2 = lMin === cursor.line2 ? cursor.key1 : cursor.key2;
            selHTML += translateSelection(k1, lMin);
            for (let line = lMin + 1; line < lMax; line++) {
                selHTML += translateSelection(0, line);
            }
            if (cursor.line1 !== cursor.line2) {
                selHTML += `<div style="translate: ${translateToCode(0, lMax)}; width: ${k2 * CW}px"></div>`;
            }
        }
        selectionDiv.innerHTML = selHTML;
    }

    function setFocus(value: boolean) {
        if (isFocusing === value) return;
        if (!value) return;
        isFocusing = value;
        cursorDiv.hidden = !isFocusing;
        if (!isFocusing) isMouseDown = false;
        updateCursorPosition();
    }

    function updateLineList() {
        let lineListStr = "";
        for (let i = 0; i < code.length; i++) lineListStr += `<div class="lines-line">${i + 1}</div>`;
        linesDiv.innerHTML = lineListStr;
    }

    function updateLineFormat(index: number) {
        const line = <HTMLDivElement>codeDiv.children[index];
        let html = "";
        const content = code[index];
        const tokens = tokenizeJS(content);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            html += `<span style="color:${token.color}">${token.value}</span>`;
        }
        line.innerHTML = html;
    }

    function write(key: string) {
        if (key === "\n") return CustomKeys.Enter();
        if (key === "\b") return CustomKeys.Backspace();
        if (hasSelection()) CustomKeys.Backspace();
        const lineCode = code[cursor.line1];
        code[cursor.line1] = lineCode.substring(0, cursor.key1) + key + lineCode.substring(cursor.key1);
        cursor.key1 = ++cursor.key2;
        updateLineFormat(cursor.line1);
        updateCursorPosition();
    }

    function hasSelection() {
        return cursor.key1 !== cursor.key2 || cursor.line1 !== cursor.line2;
    }

    function putSelectionToEnd() {
        const kMax = Math.max(cursor.key1, cursor.key2);
        const lMax = Math.max(cursor.line1, cursor.line2);
        cursor.key1 = cursor.key2 = kMax;
        cursor.line1 = cursor.line2 = lMax;
        updateCursorPosition();
    }

    function doKeyLimits() {
        if (cursor.key1 < 0) {
            cursor.key1 = cursor.key2 = 0;
        }
        if (cursor.key1 > code[cursor.line1].length) {
            cursor.key1 = cursor.key2 = code[cursor.line1].length;
        }
        if (cursor.line1 < 0) {
            cursor.line1 = cursor.line2 = 0;
        }
        if (cursor.line1 > code.length - 1) {
            cursor.line1 = cursor.line2 = code.length - 1;
        }
        updateCursorPosition();
    }

    linesDiv.innerHTML = "1";
    cursorDiv.hidden = true;
    const code: string[] = ["11111111111", "11111111111", "11111111111", "11111111111"];
    for (let i = 0; i < code.length; i++) {
        codeDiv.innerHTML += `<div class="line"></div>`;
        updateLineList();
        updateLineFormat(i);
        cursor.line1 = ++cursor.line2;
    }
    addEventListener("blur", () => setFocus(false));
    addEventListener("mousedown", e => {
        setFocus(e.composedPath().includes(codeDiv));
    });

    const CustomKeys = {
        Enter() {
            if (hasSelection()) {
                CustomKeys.Backspace();
            }
            const div = document.createElement("div");
            div.classList.add("line");
            const currentLine = codeDiv.children[cursor.line1];
            if (currentLine) currentLine.insertAdjacentElement("afterend", div);
            else codeDiv.appendChild(div);
            code.splice(cursor.line1 + 1, 0, "");
            const lineCode = code[cursor.line1];
            code[cursor.line1] = lineCode.substring(0, cursor.key1);
            code[cursor.line1 + 1] = lineCode.substring(cursor.key1);
            cursor.line1 = ++cursor.line2;
            cursor.key1 = 0;
            cursor.key2 = 0;
            updateLineFormat(cursor.line1 - 1);
            updateLineFormat(cursor.line1);
            updateCursorPosition();
            updateLineList();
            editor.scrollTop = editor.scrollHeight;
        },
        Backspace() {
            if (hasSelection()) {
                if (cursor.line1 === cursor.line2) {
                    const kMin = Math.min(cursor.key1, cursor.key2);
                    const kMax = Math.max(cursor.key1, cursor.key2);
                    const lineCode = code[cursor.line1];
                    code[cursor.line1] = lineCode.substring(0, kMin) + lineCode.substring(kMax);
                    cursor.key1 = cursor.key2 = kMin;
                    updateLineFormat(cursor.line1);
                    updateCursorPosition();
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
                updateCursorPosition();
                return;
            }
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
            code[cursor.line1] = code[cursor.line2] = lineCode.substring(0, cursor.key1 - 1) + lineCode.substring(cursor.key1);
            updateLineFormat(cursor.line1);
            cursor.key1 = --cursor.key2;
            updateCursorPosition();
        },
        ArrowRight(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) return putSelectionToEnd();
            cursor.key1 = ++cursor.key2;
            if (cursor.key1 > code[cursor.line1].length && cursor.line1 < code.length - 1) {
                cursor.line1 = ++cursor.line2;
                cursor.key1 = cursor.key2 = 0;
            }
            doKeyLimits();
        },
        ArrowLeft(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) return putSelectionToEnd();
            cursor.key1 = --cursor.key2;
            if (cursor.key1 < 0 && cursor.line1 > 0) {
                cursor.line1 = --cursor.line2;
                cursor.key1 = cursor.key2 = Infinity; // this will make it will go to the end of that line
            }
            doKeyLimits();
        },
        ArrowUp(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) return putSelectionToEnd();
            cursor.line1 = --cursor.line2;
            doKeyLimits();
        },
        ArrowDown(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) return putSelectionToEnd();
            if (cursor.line1 >= code.length - 1) return;
            cursor.line1 = ++cursor.line2;
            doKeyLimits();
        },
        Tab(event: KeyboardEvent) {
            event.preventDefault();
            write(" ");
            write(" ");
            write(" ");
            write(" ");
        }
    };
    const IgnoredKeys = [
        "Alt", "Shift", "Control"
    ];
    addEventListener("keydown", e => {
        if (!isFocusing) return;
        if (IgnoredKeys.includes(e.key)) return;
        if (e.key in CustomKeys) {
            // @ts-ignore
            return CustomKeys[e.key](e);
        }
        if (e.key.length !== 1) {
            return console.log(e.key);
        }
        write(e.key);
    });
    codeDiv.addEventListener("mousedown", e => {
        isMouseDown = true;
        const rect = codeDiv.getBoundingClientRect();
        const y = Math.max(0, Math.min(code.length - 1, Math.floor((e.clientY - rect.y) / CH)));
        const x = Math.max(0, Math.min(code[y].length, Math.round((e.clientX - rect.x) / CW)));
        cursor.line1 = y;
        cursor.line2 = y;
        cursor.key1 = x;
        cursor.key2 = x;
        updateCursorPosition();
    });
    addEventListener("mousemove", e => {
        if (!isMouseDown) return;
        const rect = codeDiv.getBoundingClientRect();
        const y = Math.max(0, Math.min(code.length - 1, Math.floor((e.clientY - rect.y) / CH)));
        const x = Math.max(0, Math.min(code[y].length, Math.round((e.clientX - rect.x) / CW)));
        cursor.line2 = y;
        cursor.key2 = x;
        updateCursorPosition();
    });
    addEventListener("mouseup", () => {
        if (!isMouseDown) return;
        isMouseDown = false;
    });
}