import {tokenizeJS} from "./tokenizer";

export function Editor(editor: HTMLDivElement) {
    const linesDiv = <HTMLDivElement>editor.querySelector(".lines");
    const codeDiv = <HTMLDivElement>editor.querySelector(".code");
    const cursorDiv = <HTMLDivElement>document.querySelector(".cursor");
    let isFocusing = false;
    const CW = 8.88;
    const CH = 19;

    function updateCursorPosition() {
        cursorDiv.style.left = linesDiv.getBoundingClientRect().width + cursorKeyIndex * CW + 0.5 + "px";
        cursorDiv.style.top = cursorLineIndex * CH + 1.5 + "px";
    }

    function setFocus(value: boolean) {
        if (isFocusing === value) return;
        isFocusing = value;
        cursorDiv.hidden = !isFocusing;
        updateCursorPosition();
    }

    function updateLineList() {
        let lineListStr = "";
        for (let i = 0; i < linesNum; i++) lineListStr += `<div class="lines-line">${i + 1}</div>`;
        linesDiv.innerHTML = lineListStr;
        updateCursorPosition();
    }

    function addLine() {
        linesNum++;
        const div = document.createElement("div");
        div.classList.add("line");
        const currentLine = codeDiv.children[cursorLineIndex];
        if (currentLine) currentLine.insertAdjacentElement("afterend", div);
        else codeDiv.appendChild(div);
        updateLineList();
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
        const lineCode = code[cursorLineIndex];
        code[cursorLineIndex] = lineCode.substring(0, cursorKeyIndex) + key + lineCode.substring(cursorKeyIndex);
        cursorKeyIndex++;
        updateLineFormat(cursorLineIndex);
        updateCursorPosition();
    }

    let linesNum = 0;
    let cursorLineIndex = 0;
    let cursorKeyIndex = 0;
    linesDiv.innerHTML = "1";
    cursorDiv.hidden = true;
    const code: string[] = [""];
    for (let i = 0; i < code.length; i++) {
        addLine();
        updateLineFormat(i);
        cursorLineIndex++;
    }
    addEventListener("blur", () => setFocus(false));
    addEventListener("mousedown", e => {
        setFocus(e.composedPath().includes(codeDiv));
    });
    const CustomKeys = {
        Enter() {
            addLine();
            code.splice(cursorLineIndex + 1, 0, "");
            code[cursorLineIndex + 1] = code[cursorLineIndex].substring(cursorKeyIndex);
            code[cursorLineIndex] = code[cursorLineIndex].substring(0, cursorKeyIndex);
            cursorLineIndex++;
            cursorKeyIndex = 0;
            updateLineFormat(cursorLineIndex - 1);
            updateLineFormat(cursorLineIndex);
            updateCursorPosition();
        },
        Backspace() {
            const line = <HTMLDivElement>codeDiv.children[cursorLineIndex];
            if (!line.innerHTML) {
                if (cursorLineIndex === 0) return;
                code.splice(cursorLineIndex, 1);
                line.remove();
                cursorLineIndex--;
                linesNum--;
                cursorKeyIndex = code[cursorLineIndex].length;
                updateLineList();
                return;
            }
            const lineCode = code[cursorLineIndex];
            code[cursorLineIndex] = lineCode.substring(0, cursorKeyIndex - 1) + lineCode.substring(cursorKeyIndex);
            updateLineFormat(cursorLineIndex);
            cursorKeyIndex--;
            updateCursorPosition();
        },
        ArrowRight() {
            cursorKeyIndex++;
            if (cursorKeyIndex > code[cursorLineIndex].length) {
                if (!code[cursorLineIndex + 1]) {
                    cursorKeyIndex--;
                    return;
                }
                cursorKeyIndex = 0;
                cursorLineIndex++;
            }
            updateCursorPosition();
        },
        ArrowLeft() {
            cursorKeyIndex--;
            if (cursorKeyIndex < 0) {
                if (!code[cursorLineIndex - 1]) {
                    cursorKeyIndex++;
                    return;
                }
                cursorLineIndex--;
                cursorKeyIndex = code[cursorLineIndex].length;
            }
            updateCursorPosition();
        },
        ArrowUp() {
            if (cursorLineIndex <= 0) return;
            cursorLineIndex--;
            if (cursorKeyIndex > code[cursorLineIndex].length) cursorKeyIndex = code[cursorLineIndex].length;
            updateCursorPosition();
        },
        ArrowDown() {
            if (cursorLineIndex >= code.length - 1) return;
            cursorLineIndex++;
            if (cursorKeyIndex > code[cursorLineIndex].length) cursorKeyIndex = code[cursorLineIndex].length;
            updateCursorPosition();
        }
    };
    addEventListener("keydown", e => {
        if (!isFocusing) return;
        if (e.key in CustomKeys) {
            // @ts-ignore
            return CustomKeys[e.key]();
        }
        if (e.key.length !== 1) return console.log(e.key);
        write(e.key);
    });
    editor.addEventListener("mousedown", e => {
        const rect = editor.getBoundingClientRect();
        const y = Math.max(0, Math.min(code.length - 1, Math.floor((e.pageY - rect.y) / CH)));
        const x = Math.max(0, Math.min(code[y].length, Math.round((e.pageX - rect.x) / CW - 3)));
        cursorLineIndex = y;
        cursorKeyIndex = x;
        updateCursorPosition();
    });
}