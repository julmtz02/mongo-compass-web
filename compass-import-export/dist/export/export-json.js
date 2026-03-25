"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportJSONFromQuery = exports.exportJSONFromAggregation = exports.exportJSON = void 0;
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const bson_1 = require("bson");
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const hadron_document_1 = require("hadron-document");
const logger_1 = require("../utils/logger");
const export_cursor_1 = require("./export-cursor");
const debug = (0, logger_1.createDebug)('export-json');
function getEJSONOptionsForVariant(variant) {
    if (variant === 'relaxed') {
        return {
            relaxed: true,
        };
    }
    return variant === 'canonical'
        ? {
            relaxed: false, // canonical
        }
        : undefined; // default
}
async function exportJSON({ output, abortSignal, input, progressCallback, variant, }) {
    let docsWritten = 0;
    const ejsonOptions = getEJSONOptionsForVariant(variant);
    if (abortSignal?.aborted) {
        return {
            docsWritten,
            aborted: true,
        };
    }
    output.write('[');
    const docStream = new stream_1.Transform({
        objectMode: true,
        transform: function (chunk, encoding, callback) {
            // NOTE: This count is used as the final documents written count,
            // however it does not, at this point, represent the count of documents
            // written to the file as this is an earlier point in the pipeline.
            ++docsWritten;
            progressCallback?.(docsWritten);
            try {
                const doc = variant === 'default'
                    ? (0, hadron_document_1.objectToIdiomaticEJSON)(chunk, { indent: 2 })
                    : bson_1.EJSON.stringify(chunk, undefined, 2, ejsonOptions);
                const line = `${docsWritten > 1 ? ',\n' : ''}${doc}`;
                callback(null, line);
            }
            catch (err) {
                callback(err);
            }
        },
        final: function (callback) {
            this.push(']');
            callback(null);
        },
    });
    try {
        const inputStream = input.stream();
        await (0, promises_1.pipeline)([inputStream, docStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
    }
    catch (err) {
        if (err.code === 'ABORT_ERR') {
            return {
                docsWritten,
                aborted: true,
            };
        }
        throw err;
    }
    finally {
        // Finish the array output
        output.write(']\n');
        void input.close();
    }
    return {
        docsWritten,
        aborted: !!abortSignal?.aborted,
    };
}
exports.exportJSON = exportJSON;
async function exportJSONFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }) {
    debug('exportJSONFromAggregation()', { ns: (0, mongodb_ns_1.default)(ns), aggregation });
    const aggregationCursor = (0, export_cursor_1.createAggregationCursor)({
        ns,
        aggregation,
        dataService,
        preferences,
    });
    return await exportJSON({
        ...exportOptions,
        input: aggregationCursor,
    });
}
exports.exportJSONFromAggregation = exportJSONFromAggregation;
async function exportJSONFromQuery({ ns, query = { filter: {} }, dataService, ...exportOptions }) {
    debug('exportJSONFromQuery()', { ns: (0, mongodb_ns_1.default)(ns), query });
    const findCursor = (0, export_cursor_1.createFindCursor)({
        ns,
        query,
        dataService,
    });
    return await exportJSON({
        ...exportOptions,
        input: findCursor,
    });
}
exports.exportJSONFromQuery = exportJSONFromQuery;
//# sourceMappingURL=export-json.js.map