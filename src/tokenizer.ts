export function tokenizeJS(code: string) {
    const tokens: { color: string, value: string }[] = [];
    const regex = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|\/\*(.|[\r\n])*?\*\/|\/\/[^\r\n]*|\/(\/)?([^\r\n\/])*|([A-Za-z_]\w*)|(-?\d+(\.\d*)?|0x[0-9a-f]+|\.\d+)|./g;
    code.replace(regex, (match, ...args) => {
        if (match === " ") {
            tokens.push({color: "", value: "&nbsp;"}); // Space
            return "";
        }
        if (match === `""` || match === `''` || args[0] || args[1]) {
            tokens.push({color: "#699f52", value: match}); // String
            return "";
        }
        if (args[2] || args[3]) {
            tokens.push({color: "#787d73", value: match}); // Comment
            return "";
        }
        if (args[4]) {
            tokens.push({color: "#53a7d5", value: match}); // Identifier
            return "";
        }
        if (args[5]) {
            tokens.push({color: "#29ab94", value: match}); // Number
            return "";
        }
        tokens.push({color: "auto", value: match}); // Punctuation
        return "";
    });
    return tokens;
}