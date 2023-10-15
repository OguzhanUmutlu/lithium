type Token = { type: 0 | 1 | 2, text: string };
const TOKEN_NUMBER = 0;
const TOKEN_SYMBOL = 1;
const TOKEN_TEXT = 2;

const numbers = [..."0123456789"];
const symbols = [..."!?:=+-*/\\()[]{}&%$^'`\"><;,.@ \n\r"];
const keywords = [
    "abstract", "async", "await", "break", "case", "catch", "class", "const",
    "continue", "debugger", "default", "delete", "do", "else", "enum", "export",
    "extends", "false", "final", "finally", "for", "function", "goto", "if",
    "implements", "import", "in", "instanceof", "interface", "let", "new", "null",
    "package", "private", "protected", "public", "return", "static", "super",
    "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while",
    "with", "yield",

    "string", "number", "undefined", "string", "boolean"
];
const quotations = [..."\"'`"]

const COLOR_STRING = "#699f52";
const COLOR_COMMENT = "#787d73";
const COLOR_FUNCTION = "#53a7d5";
const COLOR_MEMBER = "#c67c97";
const COLOR_NUMBER = "#53a7d5";
const COLOR_KEYWORD = "#ce7140";

const getTokenType = (char: string) => {
    if (numbers.includes(char)) return TOKEN_NUMBER;
    if (symbols.includes(char)) return TOKEN_SYMBOL;
    return TOKEN_TEXT;
};

export function tokenizeJS(code: string) {
    const tokens: Token[] = [];
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const type = getTokenType(char);
        if (type === TOKEN_SYMBOL) {
            tokens.push({type, text: char});
            continue;
        }
        let text = char;
        while (true) {
            i++;
            const c2 = code[i];
            if (i === code.length || getTokenType(c2) !== type) {
                tokens.push({type, text});
                i--;
                break;
            }
            text += c2;
        }
    }
    return tokens;
}

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

export function paintJS(code: string) {
    const tokens = tokenizeJS(code);
    const parts: { color: string, text: string }[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === TOKEN_SYMBOL) {
            if (quotations.includes(token.text)) {
                let init = token.text;
                let backslash = false;
                let text = init;
                while (true) {
                    i++;
                    const t2 = tokens[i];
                    if (i === tokens.length || (t2.text === init && !backslash)) {
                        if (t2) text += init;
                        break;
                    }
                    // todo: template strings
                    if (t2.text === "\\") backslash = !backslash;
                    else backslash = false;
                    text += t2.text;
                }
                parts.push({color: COLOR_STRING, text: text});
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
        if (keywords.includes(token.text)) {
            parts.push({color: COLOR_KEYWORD, text: token.text});
            continue;
        }
        parts.push({color: "", text: token.text});
    }
    return parts;
}