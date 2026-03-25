import type { Readable } from 'stream';
import type { Delimiter, Linebreak, CSVField } from '../csv/csv-types';
type AnalyzeProgress = {
    bytesProcessed: number;
    docsProcessed: number;
};
type AnalyzeCSVFieldsOptions = {
    input: Readable;
    delimiter: Delimiter;
    newline: Linebreak;
    abortSignal?: AbortSignal;
    progressCallback?: (progress: AnalyzeProgress) => void;
    ignoreEmptyStrings?: boolean;
};
export type AnalyzeCSVFieldsResult = {
    totalRows: number;
    aborted: boolean;
    fields: Record<string, CSVField>;
};
export declare function analyzeCSVFields({ input, delimiter, newline, abortSignal, progressCallback, ignoreEmptyStrings, }: AnalyzeCSVFieldsOptions): Promise<AnalyzeCSVFieldsResult>;
export {};
//# sourceMappingURL=analyze-csv-fields.d.ts.map