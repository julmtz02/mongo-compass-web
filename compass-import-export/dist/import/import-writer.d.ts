import type { Document, BulkWriteResult } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import type { ErrorJSON } from '../import/import-types';
type PartialBulkWriteResult = Partial<Pick<BulkWriteResult, 'insertedCount' | 'getWriteErrors'>>;
type BulkOpResult = {
    insertedCount: number;
    numWriteErrors: number;
};
export declare class ImportWriter {
    dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>;
    ns: string;
    BATCH_SIZE: number;
    docsWritten: number;
    docsProcessed: number;
    docsErrored: number;
    stopOnErrors?: boolean;
    batch: Document[];
    _batchCounter: number;
    errorCallback?: (error: ErrorJSON) => void;
    constructor(dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>, ns: string, stopOnErrors?: boolean);
    write(document: Document): Promise<void>;
    finish(): Promise<void>;
    _executeBatch(): Promise<void>;
    _insertOneByOne(documents: Document[]): Promise<PartialBulkWriteResult>;
    _getBulkOpResult(result: PartialBulkWriteResult): BulkOpResult;
}
export {};
//# sourceMappingURL=import-writer.d.ts.map