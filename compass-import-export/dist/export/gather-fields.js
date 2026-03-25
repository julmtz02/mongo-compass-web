"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatherFieldsFromQuery = exports.createProjectionFromSchemaFields = void 0;
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const mongodb_schema_1 = require("mongodb-schema");
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const hadron_document_1 = require("hadron-document");
const logger_1 = require("../utils/logger");
const debug = (0, logger_1.createDebug)('export-json');
function createProjectionFromSchemaFields(fields) {
    const projection = {};
    for (const fieldPath of fields) {
        let current = projection;
        for (const [index, fieldName] of fieldPath.entries()) {
            // Set the projection when it's the last index.
            if (index === fieldPath.length - 1) {
                // If we previously encountered ['foo', 'bar'], then ['foo'] after that,
                // this will override it so you get all of 'foo'. ie. it should be the
                // most inclusive
                current[fieldName] = 1;
                break;
            }
            if (!current[fieldName]) {
                current[fieldName] = {};
            }
            // Only descend if we're adding to a {}. Don't try and add on to a true.
            // ie. keep the projection as inclusive as possible. So if we already
            // encountered ['foo'], then ['foo', 'bar'] and ['foo', 'bar', 'baz'] will
            // be ignored.
            if (current[fieldName] === 1) {
                break;
            }
            current = current[fieldName];
        }
    }
    // When _id isn't explicitly passed then we assume it's not
    // intended to be in the results.
    if (projection._id === undefined) {
        projection._id = 0;
    }
    return projection;
}
exports.createProjectionFromSchemaFields = createProjectionFromSchemaFields;
// You probably want to use gatherFieldsFromQuery() rather
async function _gatherFields({ input, abortSignal, progressCallback, }) {
    const schemaAnalyzer = new mongodb_schema_1.SchemaAnalyzer();
    const result = {
        docsProcessed: 0,
        aborted: false,
    };
    const analyzeStream = new stream_1.Transform({
        objectMode: true,
        transform: (doc, encoding, callback) => {
            schemaAnalyzer
                .analyzeDoc(doc)
                .then(() => {
                result.docsProcessed++;
                progressCallback?.(result.docsProcessed);
                callback();
            })
                .catch(callback);
        },
    });
    try {
        await (0, promises_1.pipeline)([input, analyzeStream], ...(abortSignal ? [{ signal: abortSignal }] : []));
    }
    catch (err) {
        if (err.code === 'ABORT_ERR') {
            result.aborted = true;
        }
        else {
            throw err;
        }
    }
    const paths = schemaAnalyzer
        .getSchemaPaths()
        .filter((fieldPaths) => !(0, hadron_document_1.isInternalFieldPath)(fieldPaths[0]));
    return {
        paths,
        ...result,
    };
}
function capLimitToSampleSize(limit, sampleSize) {
    if (limit) {
        if (sampleSize) {
            return Math.min(limit, sampleSize);
        }
        else {
            return limit;
        }
    }
    else {
        if (sampleSize) {
            return sampleSize;
        }
        else {
            return undefined;
        }
    }
}
async function gatherFieldsFromQuery({ ns, dataService, query = { filter: {} }, sampleSize, ...exportOptions }) {
    debug('gatherFieldsFromQuery()', { ns: (0, mongodb_ns_1.default)(ns) });
    const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
        // At the time of writing the export UI won't use this code if there is a
        // projection, but we might as well pass it along if it is there, then this
        // function can give you the unique set of fields for any find query.
        projection: query.projection,
        sort: query.sort,
        // We optionally sample by setting a limit, but the user could have also
        // specified a limit so we might have to combine them somehow
        limit: capLimitToSampleSize(query.limit, sampleSize),
        skip: query.skip,
    });
    const input = findCursor.stream();
    try {
        return await _gatherFields({
            input,
            ...exportOptions,
        });
    }
    finally {
        void findCursor.close();
    }
}
exports.gatherFieldsFromQuery = gatherFieldsFromQuery;
//# sourceMappingURL=gather-fields.js.map