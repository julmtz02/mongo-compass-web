"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCSVFromAggregation = exportCSVFromAggregation;
exports.exportCSVFromQuery = exportCSVFromQuery;
const fs_1 = __importDefault(require("fs"));
const bson_1 = require("bson");
const promises_1 = require("stream/promises");
const stream_1 = require("stream");
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const Parser_1 = __importDefault(require("stream-json/Parser"));
const StreamValues_1 = __importDefault(require("stream-json/streamers/StreamValues"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const export_utils_1 = require("./export-utils");
const csv_utils_1 = require("../csv/csv-utils");
const csv_utils_2 = require("../csv/csv-utils");
const logger_1 = require("../utils/logger");
const export_cursor_1 = require("./export-cursor");
const debug = (0, logger_1.createDebug)('export-csv');
const generateTempFilename = (suffix) => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `temp-${randomString}${suffix}`;
    return path_1.default.join(os_1.default.tmpdir(), filename);
};
class CSVRowStream extends stream_1.Transform {
    constructor({ columns, delimiter, linebreak, progressCallback, }) {
        super({ objectMode: true });
        this.docsWritten = 0;
        this.columns = columns;
        this.progressCallback = progressCallback;
        this.delimiter = delimiter;
        this.linebreak = linebreak;
    }
    _transform(chunk, enc, cb) {
        this.docsWritten++;
        // We don't debug on every line passed as it will significantly slow down the
        // export, however this is useful when diagnosing issues.
        //debug('CSVRowStream', { chunk });
        try {
            const row = this.columns.map((path) => (0, export_utils_1.lookupValueForPath)(chunk, path));
            const values = row.map((value) => (0, csv_utils_1.stringifyCSVValue)(value, {
                delimiter: this.delimiter,
            }));
            // We don't debug on every line passed as it will significantly slow down the
            // export, however this is useful when diagnosing issues.
            //const doc = _.zipObject(this.columns.map(formatCSVHeaderName), values);
            //console.dir(doc, { depth: Infinity });
            const line = (0, csv_utils_1.formatCSVLine)(values, {
                delimiter: this.delimiter,
                linebreak: this.linebreak,
            });
            this.progressCallback?.(this.docsWritten, 'WRITE');
            cb(null, line);
        }
        catch (err) {
            cb(err);
        }
    }
}
// You probably want to use exportCSVFromAggregation() or exportCSVFromQuery() rather
async function _exportCSV({ output, abortSignal, input, columns, progressCallback, delimiter = ',', linebreak = '\n', }) {
    const headers = columns.map((path) => (0, csv_utils_2.formatCSVHeaderName)(path));
    output.write((0, csv_utils_1.formatCSVLine)(headers.map((header) => (0, csv_utils_1.formatCSVValue)(header, { delimiter })), { delimiter, linebreak }));
    const rowStream = new CSVRowStream({
        columns,
        delimiter,
        linebreak,
        progressCallback,
    });
    try {
        await (0, promises_1.pipeline)([input, rowStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
    }
    catch (err) {
        if (err.code === 'ABORT_ERR') {
            return {
                docsWritten: rowStream.docsWritten,
                aborted: true,
            };
        }
        throw err;
    }
    return {
        docsWritten: rowStream.docsWritten,
        aborted: !!abortSignal?.aborted,
    };
}
class EJSONStream extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(chunk, enc, cb) {
        // We don't debug on every line passed as it will significantly slow down the
        // export, however this is useful when diagnosing issues.
        //debug('EJSONStream', { chunk });
        // We need relaxed: false so that BSONSymbols and possibly other values will
        // be bson values and not strings or numbers. That way we can unambiguously
        // serialize them.
        cb(null, bson_1.EJSON.deserialize(chunk.value, { relaxed: false }));
    }
}
class ColumnStream extends stream_1.Transform {
    constructor(progressCallback) {
        super({ objectMode: true });
        this.docsProcessed = 0;
        this.columnRecorder = new export_utils_1.ColumnRecorder();
        this.progressCallback = progressCallback;
    }
    _transform(chunk, enc, cb) {
        // We don't debug on every line passed as it will significantly slow down the
        // export, however this is useful when diagnosing issues.
        //debug('ColumnStream', { chunk });
        this.columnRecorder.addToColumns(chunk);
        this.docsProcessed++;
        this.progressCallback?.(this.docsProcessed, 'DOWNLOAD');
        cb(null, `${bson_1.EJSON.stringify(chunk, { relaxed: true })}\n`);
    }
    getColumns() {
        return this.columnRecorder.columns;
    }
}
async function loadEJSONFileAndColumns({ cursor, abortSignal, progressCallback, }) {
    // Write the cursor to a temp file containing one ejson doc per line
    // while simultaneously determining the unique set of columns in the order
    // we'll have to write to the file.
    const inputStream = cursor.stream();
    const filename = generateTempFilename('.jsonl');
    const output = fs_1.default.createWriteStream(filename);
    const columnStream = new ColumnStream(progressCallback);
    try {
        await (0, promises_1.pipeline)([inputStream, columnStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
    }
    finally {
        void cursor.close();
    }
    const columns = columnStream.getColumns();
    debug('columns', JSON.stringify(columns));
    // Make a stream of EJSON documents for the temp file
    const input = fs_1.default
        .createReadStream(filename)
        .pipe(Parser_1.default.parser({ jsonStreaming: true }))
        .pipe(StreamValues_1.default.streamValues())
        .pipe(new EJSONStream());
    debug(`writing to ${filename}`);
    return { filename, input, columns };
}
async function exportCSVFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }) {
    debug('exportCSVFromAggregation()', { ns: (0, mongodb_ns_1.default)(ns), aggregation });
    const aggregationCursor = (0, export_cursor_1.createAggregationCursor)({
        ns,
        aggregation,
        dataService,
        preferences,
    });
    let filename, input, columns;
    try {
        try {
            ({ filename, input, columns } = await loadEJSONFileAndColumns({
                cursor: aggregationCursor,
                abortSignal: exportOptions.abortSignal,
                progressCallback: exportOptions.progressCallback,
            }));
        }
        catch (err) {
            if (err.code === 'ABORT_ERR') {
                // aborted while still in the download phase, so no docs written yet
                return {
                    docsWritten: 0,
                    aborted: true,
                };
            }
            throw err;
        }
        finally {
            // at this point we don't need the cursor anymore, because we've
            // downloaded all the rows to a temporary file
            void aggregationCursor.close();
        }
        return await _exportCSV({
            ...exportOptions,
            input,
            columns,
        });
    }
    finally {
        if (filename) {
            // clean up the temporary file
            void fs_1.default.promises.rm(filename);
        }
    }
}
async function exportCSVFromQuery({ ns, query = { filter: {} }, dataService, ...exportOptions }) {
    debug('exportCSVFromQuery()', { ns: (0, mongodb_ns_1.default)(ns), query });
    const findCursor = (0, export_cursor_1.createFindCursor)({
        ns,
        query,
        dataService,
    });
    let filename, input, columns;
    try {
        try {
            ({ filename, input, columns } = await loadEJSONFileAndColumns({
                cursor: findCursor,
                abortSignal: exportOptions.abortSignal,
                progressCallback: exportOptions.progressCallback,
            }));
        }
        catch (err) {
            if (err.code === 'ABORT_ERR') {
                // aborted while still in the download phase, so no docs written yet
                return {
                    docsWritten: 0,
                    aborted: true,
                };
            }
            throw err;
        }
        finally {
            // at this point we don't need the cursor anymore, because we've
            // downloaded all the rows to a temporary file
            void findCursor.close();
        }
        return await _exportCSV({
            ...exportOptions,
            input,
            columns,
        });
    }
    finally {
        if (filename) {
            // clean up the temporary file
            void fs_1.default.promises.rm(filename);
        }
    }
}
//# sourceMappingURL=export-csv.js.map