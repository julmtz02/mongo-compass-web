/// <reference types="node" />
import type { Readable } from 'stream';
import type { Delimiter, Linebreak } from '../csv/csv-types';
type GuessFileTypeOptions = {
    input: Readable;
};
type GuessFileTypeResult = {
    type: 'json' | 'jsonl' | 'unknown';
} | {
    type: 'csv';
    csvDelimiter: Delimiter;
    newline: Linebreak;
};
export declare function guessFileType({ input, }: GuessFileTypeOptions): Promise<GuessFileTypeResult>;
export {};
//# sourceMappingURL=guess-filetype.d.ts.map