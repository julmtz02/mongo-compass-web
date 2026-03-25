"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportWriter = void 0;
const logger_1 = require("../utils/logger");
const debug = (0, logger_1.createDebug)('import-writer');
class ImportWriterError extends Error {
    constructor(writeErrors) {
        super('Something went wrong while writing data to a collection');
        this.name = 'ImportWriterError';
        this.writeErrors = writeErrors;
    }
}
function writeErrorToJSError({ errInfo, errmsg, err, code, index, }) {
    const op = err?.op;
    const e = new Error(errmsg);
    e.index = index;
    e.code = code;
    e.op = op;
    e.errInfo = errInfo;
    // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
    e.name = index !== undefined && op ? 'WriteError' : 'WriteConcernError';
    return e;
}
class ImportWriter {
    constructor(dataService, ns, stopOnErrors) {
        this.dataService = dataService;
        this.ns = ns;
        this.BATCH_SIZE = 1000;
        this.docsWritten = 0;
        this.docsProcessed = 0;
        this.docsErrored = 0;
        this.stopOnErrors = stopOnErrors;
        this.batch = [];
        this._batchCounter = 0;
    }
    async write(document) {
        this.batch.push(document);
        if (this.batch.length >= this.BATCH_SIZE) {
            await this._executeBatch();
        }
    }
    async finish() {
        if (this.batch.length === 0) {
            debug('%d docs written', this.docsWritten);
            return;
        }
        debug('draining buffered docs', this.batch.length);
        await this._executeBatch();
    }
    async _executeBatch() {
        const documents = this.batch;
        this.docsProcessed += documents.length;
        this.batch = [];
        let bulkWriteResult;
        try {
            bulkWriteResult = await this.dataService.bulkWrite(this.ns, documents.map((document) => ({
                insertOne: { document },
            })), {
                ordered: this.stopOnErrors,
                retryWrites: false,
                checkKeys: false,
            });
        }
        catch (bulkWriteError) {
            // Currently, the server does not support batched inserts for FLE2:
            // https://jira.mongodb.org/browse/SERVER-66315
            // We check for this specific error and re-try inserting documents one by one.
            if (bulkWriteError.code === 6371202) {
                this.BATCH_SIZE = 1;
                bulkWriteResult = await this._insertOneByOne(documents);
            }
            else {
                // If we are writing with `ordered: false`, bulkWrite will throw and
                // will not return any result, but server might write some docs and bulk
                // result can still be accessed on the error instance
                // Driver seems to return null instead of undefined in some rare cases
                // when the operation ends in error, instead of relying on
                // `_mergeBulkOpResult` default argument substitution, we need to keep
                // this OR expression here
                bulkWriteResult = (bulkWriteError.result ||
                    {});
                if (this.stopOnErrors) {
                    this.docsWritten += bulkWriteResult.insertedCount || 0;
                    this.docsErrored +=
                        (bulkWriteResult.getWriteErrors?.() || []).length || 0;
                    throw bulkWriteError;
                }
            }
        }
        const bulkOpResult = this._getBulkOpResult(bulkWriteResult);
        const writeErrors = (bulkWriteResult?.getWriteErrors?.() || []).map(writeErrorToJSError);
        this.docsWritten += bulkOpResult.insertedCount;
        this.docsErrored += bulkOpResult.numWriteErrors;
        this._batchCounter++;
        if (writeErrors.length) {
            throw new ImportWriterError(writeErrors);
        }
    }
    async _insertOneByOne(documents) {
        let insertedCount = 0;
        const errors = [];
        for (const doc of documents) {
            try {
                await this.dataService.insertOne(this.ns, doc);
                insertedCount += 1;
            }
            catch (insertOneByOneError) {
                if (this.stopOnErrors) {
                    this.docsWritten += insertedCount;
                    this.docsErrored += 1;
                    throw insertOneByOneError;
                }
                errors.push(insertOneByOneError);
            }
        }
        return {
            insertedCount,
            getWriteErrors: () => {
                return errors;
            },
        };
    }
    _getBulkOpResult(result) {
        const writeErrors = result.getWriteErrors?.() || [];
        return {
            insertedCount: result.insertedCount || 0,
            numWriteErrors: writeErrors.length,
        };
    }
}
exports.ImportWriter = ImportWriter;
//# sourceMappingURL=import-writer.js.map