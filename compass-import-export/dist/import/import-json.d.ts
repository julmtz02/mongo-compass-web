/// <reference types="node" />
import type { Readable } from 'stream';
import type { ImportOptions, ImportResult } from './import-types';
type JSONVariant = 'json' | 'jsonl';
type ImportJSONOptions = ImportOptions & {
    input: Readable;
    jsonVariant: JSONVariant;
};
export declare function importJSON({ dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, input, jsonVariant, }: ImportJSONOptions): Promise<ImportResult>;
export {};
//# sourceMappingURL=import-json.d.ts.map