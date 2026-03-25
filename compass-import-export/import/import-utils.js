"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocStatsCollector = void 0;
exports.makeImportResult = makeImportResult;
exports.errorToJSON = errorToJSON;
exports.writeErrorToLog = writeErrorToLog;
exports.doImport = doImport;
const os_1 = __importDefault(require("os"));
const stream_1 = require("stream");
const import_writer_1 = require("./import-writer");
const logger_1 = require("../utils/logger");
const utf8_validator_1 = require("../utils/utf8-validator");
const byte_counter_1 = require("../utils/byte-counter");
const strip_bom_stream_1 = __importDefault(require("strip-bom-stream"));
const debug = (0, logger_1.createDebug)('import');
function makeImportResult(importWriter, numProcessed, numParseErrors, docStatsStream, aborted) {
    const result = {
        docsErrored: numParseErrors + importWriter.docsErrored,
        docsWritten: importWriter.docsWritten,
        ...docStatsStream.getStats(),
        // docsProcessed is not on importWriter so that it includes docs that
        // produced parse errors and therefore never made it that far
        docsProcessed: numProcessed,
    };
    if (aborted) {
        result.aborted = aborted;
    }
    return result;
}
function errorToJSON(error) {
    const obj = {
        name: error.name,
        message: error.message,
    };
    for (const key of ['index', 'code', 'op', 'errInfo']) {
        if (error[key] !== undefined) {
            obj[key] = error[key];
        }
    }
    return obj;
}
function writeErrorToLog(output, error) {
    return new Promise(function (resolve) {
        output.write(JSON.stringify(error) + os_1.default.EOL, 'utf8', (err) => {
            if (err) {
                debug('error while writing error', err);
            }
            // we always resolve because we ignore the error
            resolve();
        });
    });
}
function hasArrayOfLength(val, len = 250, seen = new WeakSet()) {
    if (Array.isArray(val)) {
        return val.length >= len;
    }
    if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
            return false;
        }
        seen.add(val);
        for (const prop of Object.values(val)) {
            if (hasArrayOfLength(prop, len, seen)) {
                return true;
            }
        }
    }
    return false;
}
class DocStatsCollector {
    constructor() {
        this.stats = { biggestDocSize: 0, hasUnboundArray: false };
    }
    collect(doc) {
        this.stats.hasUnboundArray =
            this.stats.hasUnboundArray || hasArrayOfLength(doc, 250);
        try {
            const docString = JSON.stringify(doc);
            this.stats.biggestDocSize = Math.max(this.stats.biggestDocSize, docString.length);
        }
        catch {
            // We ignore the JSON stringification error
        }
    }
    getStats() {
        return this.stats;
    }
}
exports.DocStatsCollector = DocStatsCollector;
async function doImport(input, streams, transformer, { dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, }) {
    const byteCounter = new byte_counter_1.ByteCounter();
    let stream;
    const docStatsCollector = new DocStatsCollector();
    const importWriter = new import_writer_1.ImportWriter(dataService, ns, stopOnErrors);
    let numProcessed = 0;
    let numParseErrors = 0;
    // Stream errors just get thrown synchronously unless we listen for the event
    // on each stream we use in the pipeline. By destroying the stream we're
    // iterating on and passing the error, the "for await line" will throw inside
    // the try/catch below. Relevant test: "errors if a file is truncated utf8"
    function streamErrorListener(error) {
        stream.destroy(error);
    }
    input.once('error', streamErrorListener);
    stream = input;
    const allStreams = [
        new utf8_validator_1.Utf8Validator(),
        byteCounter,
        (0, strip_bom_stream_1.default)(),
        ...streams,
    ];
    for (const s of allStreams) {
        stream = stream.pipe(s);
        stream.once('error', streamErrorListener);
    }
    if (abortSignal) {
        stream = (0, stream_1.addAbortSignal)(abortSignal, stream);
    }
    try {
        for await (const chunk of stream) {
            // Call progress and increase the number processed even if it errors
            // below. The import writer stats at the end stores how many got written.
            // This way progress updates continue even if every row fails to parse.
            ++numProcessed;
            if (!abortSignal?.aborted) {
                progressCallback?.({
                    bytesProcessed: byteCounter.total,
                    docsProcessed: numProcessed,
                    docsWritten: importWriter.docsWritten,
                });
            }
            let doc;
            try {
                doc = transformer.transform(chunk);
            }
            catch (err) {
                ++numParseErrors;
                // deal with transform error
                // rethrow with the line number / array index appended to aid debugging
                err.message = `${err.message}${transformer.lineAnnotation(numProcessed)}`;
                if (stopOnErrors) {
                    throw err;
                }
                else {
                    const transformedError = errorToJSON(err);
                    debug('transform error', transformedError);
                    errorCallback?.(transformedError);
                    if (output) {
                        await writeErrorToLog(output, transformedError);
                    }
                }
                continue;
            }
            docStatsCollector.collect(doc);
            try {
                // write
                await importWriter.write(doc);
            }
            catch (err) {
                // if there is no writeErrors property, then it isn't an
                // ImportWriteError, so probably not recoverable
                if (!err.writeErrors) {
                    throw err;
                }
                // deal with write error
                debug('write error', err);
                if (stopOnErrors) {
                    throw err;
                }
                if (!output) {
                    continue;
                }
                const errors = err.writeErrors;
                for (const error of errors) {
                    const transformedError = errorToJSON(error);
                    errorCallback?.(transformedError);
                    await writeErrorToLog(output, transformedError);
                }
            }
        }
        input.removeListener('error', streamErrorListener);
        for (const s of allStreams) {
            s.removeListener('error', streamErrorListener);
        }
        // also insert the remaining partial batch
        try {
            await importWriter.finish();
        }
        catch (err) {
            // if there is no writeErrors property, then it isn't an
            // ImportWriteError, so probably not recoverable
            if (!err.writeErrors) {
                throw err;
            }
            // deal with write error
            debug('write error', err);
            if (stopOnErrors) {
                throw err;
            }
            if (output) {
                const errors = err.writeErrors;
                for (const error of errors) {
                    const transformedError = errorToJSON(error);
                    errorCallback?.(transformedError);
                    await writeErrorToLog(output, transformedError);
                }
            }
        }
    }
    catch (err) {
        if (err.code === 'ABORT_ERR') {
            debug('import:aborting');
            const result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector, true);
            debug('import:aborted', result);
            return result;
        }
        // stick the result onto the error so that we can tell how far it got
        err.result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector);
        throw err;
    }
    debug('import:completing');
    const result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector);
    debug('import:completed', result);
    return result;
}
//# sourceMappingURL=import-utils.js.map