/// <reference types="node" />
import type { Readable } from 'stream';
import type { DataService } from 'mongodb-data-service';
import type { Document } from 'mongodb';
import type { ExportQuery } from './export-types';
export type SchemaPath = string[];
export declare function createProjectionFromSchemaFields(fields: SchemaPath[]): Document;
type ProgressCallback = (index: number) => void;
type GatherFieldsOptions = {
    input: Readable;
    abortSignal?: AbortSignal;
    progressCallback?: ProgressCallback;
};
type GatherFieldsResult = {
    docsProcessed: number;
    paths: SchemaPath[];
    aborted: boolean;
};
declare function _gatherFields({ input, abortSignal, progressCallback, }: GatherFieldsOptions): Promise<GatherFieldsResult>;
export declare function gatherFieldsFromQuery({ ns, dataService, query, sampleSize, ...exportOptions }: Omit<GatherFieldsOptions, 'input'> & {
    ns: string;
    dataService: Pick<DataService, 'findCursor'>;
    query?: ExportQuery;
    sampleSize?: number;
}): ReturnType<typeof _gatherFields>;
export {};
//# sourceMappingURL=gather-fields.d.ts.map