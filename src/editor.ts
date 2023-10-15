import {paintJS} from "./tokenizer";

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

    function makeSelectionBox(key: number, line: number, width: number) {
        return `<div style="translate: ${translateToCode(key, line)}; width: ${width * CW}px"></div>`;
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
        const tokens = paintJS(content);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            html += `<span style="color:${token.color}">${token.text === " " ? "&nbsp;" : token.text}</span>`;
        }
        line.innerHTML = html;
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
            updateLineFormat(cursor.line1 + 1);
            code.splice(cursor.line1 + 1, 0, ...new Array(lines.length - 2).fill(""));
            for (let i = 0; i < lines.length - 2; i++) { // -2 is because we already can do the first and last
                const div = document.createElement("div");
                div.classList.add("line");
                if (i === 0) codeDiv.children[cursor.line1].insertAdjacentElement("afterend", div);
                else codeDiv.appendChild(div);
                code[cursor.line1 + i + 1] = lines[i + 1];
                updateLineFormat(cursor.line1 + i + 1);
            }
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

    function eraseSelectedCode() {
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
    }

    linesDiv.innerHTML = "1";
    cursorDiv.hidden = true;
    const code: string[] = ["abc def ghi"];
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
            if (hasSelection()) return putSelectionToStart();
            cursor.key1 = --cursor.key2;
            if (cursor.key1 < 0 && cursor.line1 > 0) {
                cursor.line1 = --cursor.line2;
                cursor.key1 = cursor.key2 = Infinity; // this will make it will go to the end of that line
            }
            doKeyLimits();
        },
        ArrowUp(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) putSelectionToEnd();
            if (cursor.line1 === 0) {
                cursor.key1 = cursor.key2 = 0;
                updateCursorPosition();
                return;
            }
            cursor.line1 = --cursor.line2;
            doKeyLimits();
        },
        ArrowDown(event: KeyboardEvent) {
            event.preventDefault();
            if (hasSelection()) putSelectionToEnd();
            if (cursor.line1 >= code.length - 1) {
                cursor.key1 = cursor.key2 = code[cursor.line1].length;
                updateCursorPosition();
                return;
            }
            cursor.line1 = ++cursor.line2;
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
        writeChar(e.key);
    });

    function mouseEventCommon(e: MouseEvent, f: boolean) {
        const rect = codeDiv.getBoundingClientRect();
        const y = Math.max(0, Math.min(code.length - 1, Math.floor((e.clientY - rect.y) / CH)));
        const x = Math.max(0, Math.min(code[y].length, Math.round((e.clientX - rect.x) / CW)));
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
    addEventListener("mousemove", e => {
        if (!isMouseDown) return;
        mouseEventCommon(e, false);
    });
    addEventListener("mouseup", () => {
        if (!isMouseDown) return;
        isMouseDown = false;
    });
}