/// <reference types="node" />
import type { Document } from 'bson';
import type { Readable, Writable, Duplex } from 'stream';
import type { ImportResult, ErrorJSON, ImportOptions } from './import-types';
import { ImportWriter } from './import-writer';
export declare function makeImportResult(importWriter: ImportWriter, numProcessed: number, numParseErrors: number, docStatsStream: DocStatsCollector, aborted?: boolean): ImportResult;
export declare function errorToJSON(error: any): ErrorJSON;
export declare function writeErrorToLog(output: Writable, error: any): Promise<void>;
type DocStats = {
    biggestDocSize: number;
    hasUnboundArray: boolean;
};
export declare class DocStatsCollector {
    private stats;
    collect(doc: Document): void;
    getStats(): DocStats;
}
type Transformer = {
    transform: (chunk: any) => Document;
    lineAnnotation: (numProcessed: number) => string;
};
export declare function doImport(input: Readable, streams: Duplex[], transformer: Transformer, { dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, }: ImportOptions): Promise<ImportResult>;
export {};
//# sourceMappingURL=import-utils.d.ts.map