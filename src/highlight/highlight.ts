import {Token} from "./tokenize";

export type ColorPart = { color: string, text: string };

export abstract class Highlight {
    abstract tokenize(code: string): Token[];

    abstract paint(code: string): ColorPart[];
}