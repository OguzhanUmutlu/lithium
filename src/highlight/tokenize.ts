export type Token = { type: 0 | 1 | 2, text: string };
const TOKEN_NUMBER = 0;
const TOKEN_SYMBOL = 1;
const TOKEN_TEXT = 2;

export const NUMBERS = [..."0123456789"];
export const SYMBOLS = [..."!?:=+-*/\\()[]{}&%$^'`\"><;,.@ \n\r"];

export const getTokenType = (char: string) => {
    if (NUMBERS.includes(char)) return TOKEN_NUMBER;
    if (SYMBOLS.includes(char)) return TOKEN_SYMBOL;
    return TOKEN_TEXT;
};

export class Tokenizer {
    static tokenize(code: string) {
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
    };
}