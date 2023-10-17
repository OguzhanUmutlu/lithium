import {ColorPart, Highlight} from "./highlight";
import {Token, Tokenizer} from "./tokenize";

const TOKEN_NUMBER = 0;
const TOKEN_SYMBOL = 1;
const TOKEN_TEXT = 2;

const KEYWORDS = [
    "abstract", "async", "await", "break", "case", "catch", "class", "const",
    "continue", "debugger", "default", "delete", "do", "else", "enum", "export",
    "extends", "false", "final", "finally", "for", "function", "goto", "if",
    "implements", "import", "in", "instanceof", "interface", "let", "new", "null",
    "package", "private", "protected", "public", "return", "static", "super",
    "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while",
    "with", "yield", "type", "from",

    "string", "number", "undefined", "string", "boolean"
];
const quotations = [..."\"'`"]

const COLOR_STRING = "#699f52";
const COLOR_COMMENT = "#787d73";
const COLOR_FUNCTION = "#53a7d5";
const COLOR_MEMBER = "#c67c97";
const COLOR_NUMBER = "#53a7d5";
const COLOR_KEYWORD = "#ce7140";

function backtraceNonSpace(tokens: Token[], index: number) {
    for (let i = index; i >= 0; i--) {
        const token = tokens[i];
        if (token.text !== " ") return token;
    }
    return null;
}

function forwardtraceNonSpace(tokens: Token[], index: number) {
    for (let i = index; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.text !== " ") return token;
    }
    return null;
}

export class TypeScript extends Highlight {
    tokenize(code: string) {
        return Tokenizer.tokenize(code);
    };

    paint(code: string) {
        const tokens = this.tokenize(code);
        const parts: ColorPart[] = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === TOKEN_SYMBOL) {
                if (token.text === "/" && tokens[i + 1] && tokens[i + 1].text === "*") {
                    let text = "/*";
                    i++;
                    while (true) {
                        i++;
                        const t2 = tokens[i];
                        const t3 = tokens[i + 1];
                        if (!t2) break;
                        if (t2.text === "*" && t3 && t3.text === "/") {
                            text += "*/";
                            i++;
                            break;
                        }
                        if (t2.text === "\n") {
                            parts.push({color: COLOR_COMMENT, text: text});
                            text = "";
                            parts.push({color: "", text: "\n"});
                            continue;
                        }
                        text += t2.text;
                    }
                    parts.push({color: COLOR_COMMENT, text});
                    continue;
                }
                if (token.text === "/" && tokens[i + 1] && tokens[i + 1].text === "/") {
                    let text = "//";
                    i++;
                    while (true) {
                        i++;
                        const t2 = tokens[i];
                        if (!t2 || t2.text === "\n") {
                            i--;
                            break;
                        }
                        text += t2.text;
                    }
                    parts.push({color: COLOR_COMMENT, text});
                    continue;
                }
                if (quotations.includes(token.text)) {
                    let init = token.text;
                    let backslash = false;
                    let text = init;
                    let startI = i;
                    let addP = [];
                    while (true) {
                        i++;
                        const t2 = tokens[i];
                        if (!t2 || t2.text === "\n") {
                            if (!t2 || init !== "`") {
                                i = startI;
                                text = init;
                                addP = [];
                                break;
                            }
                            addP.push({color: COLOR_STRING, text: text});
                            text = "";
                            addP.push({color: "", text: "\n"});
                            continue;
                        }
                        if (t2.text === init && !backslash) {
                            text += init;
                            break;
                        }
                        // todo: template strings
                        if (t2.text === "\\") backslash = !backslash;
                        else backslash = false;
                        text += t2.text;
                    }
                    parts.push(...addP, {color: COLOR_STRING, text: text});
                    continue;
                }
                parts.push({color: "", text: token.text});
                continue;
            }
            if (token.type === TOKEN_NUMBER) {
                const lastToken = tokens[i - 1];
                parts.push({color: lastToken && lastToken.type === TOKEN_TEXT ? "" : COLOR_NUMBER, text: token.text});
                continue;
            }
            if (KEYWORDS.includes(token.text)) {
                parts.push({color: COLOR_KEYWORD, text: token.text});
                continue;
            }
            const backToken = backtraceNonSpace(tokens, i - 1);
            const forwardToken = forwardtraceNonSpace(tokens, i + 1);
            if (backToken && backToken.text === ".") {
                if (forwardToken && forwardToken.text === "(") {
                    parts.push({color: COLOR_FUNCTION, text: token.text});
                    continue;
                }
                parts.push({color: COLOR_MEMBER, text: token.text});
                continue;
            }
            if ((backToken && backToken.text === "function") || (forwardToken && forwardToken.text === "(")) {
                parts.push({color: COLOR_FUNCTION, text: token.text});
                continue;
            }
            parts.push({color: "", text: token.text});
        }
        return parts;
    };
}