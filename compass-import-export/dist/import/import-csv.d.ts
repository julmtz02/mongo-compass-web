/// <reference types="node" />
import type { Readable } from 'stream';
import type { Delimiter, Linebreak, IncludedFields } from '../csv/csv-types';
import type { ImportResult, ImportOptions } from './import-types';
type ImportCSVOptions = ImportOptions & {
    input: Readable;
    delimiter?: Delimiter;
    newline: Linebreak;
    ignoreEmptyStrings?: boolean;
    fields: IncludedFields;
};
export declare function importCSV({ dataService, ns, input, output, abortSignal, progressCallback, errorCallback, delimiter, newline, ignoreEmptyStrings, stopOnErrors, fields, }: ImportCSVOptions): Promise<ImportResult>;
export {};
//# sourceMappingURL=import-csv.d.ts.map