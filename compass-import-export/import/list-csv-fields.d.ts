import type { Readable } from 'stream';
import type { Delimiter, Linebreak } from '../csv/csv-types';
type ListCSVFieldsOptions = {
    input: Readable;
    delimiter: Delimiter;
    newline: Linebreak;
};
type ListCSVFieldsResult = {
    uniqueFields: string[];
    headerFields: string[];
    preview: string[][];
};
export declare function listCSVFields({ input, delimiter, newline, }: ListCSVFieldsOptions): Promise<ListCSVFieldsResult>;
export {};
//# sourceMappingURL=list-csv-fields.d.ts.map