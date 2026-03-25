"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCSVFields = analyzeCSVFields;
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const papaparse_1 = __importDefault(require("papaparse"));
const strip_bom_stream_1 = __importDefault(require("strip-bom-stream"));
const csv_utils_1 = require("../csv/csv-utils");
const utf8_validator_1 = require("../utils/utf8-validator");
const byte_counter_1 = require("../utils/byte-counter");
function initResultFields(result, headerFields) {
    for (const [columnIndex, name] of headerFields.entries()) {
        const fieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(name);
        if (!result.fields[fieldName]) {
            result.fields[fieldName] = {
                types: {},
                columnIndexes: [],
                detected: 'mixed', // we'll fill this at the end
            };
        }
        // For fields inside arrays different CSV header fields can map to
        // the same fieldName, so there will be more than one entry in
        // columnIndex.
        result.fields[fieldName].columnIndexes.push(columnIndex);
    }
}
function addRowToResult(fields, rowNum, data, ignoreEmptyStrings) {
    for (const [name, field] of Object.entries(fields)) {
        for (const columnIndex of field.columnIndexes) {
            const original = data[columnIndex] ?? '';
            const type = (0, csv_utils_1.detectCSVFieldType)(original, name, ignoreEmptyStrings);
            if (!field.types[type]) {
                field.types[type] = {
                    count: 0,
                    firstRowIndex: rowNum,
                    firstColumnIndex: columnIndex,
                    firstValue: original,
                };
            }
            ++field.types[type].count;
        }
    }
}
function pickFieldType(field) {
    const types = Object.keys(field.types);
    if (types.length === 1) {
        // This is a bit of an edge case. If a column is always empty and
        // "Ignore empty strings" is checked, we'll detect "undefined".
        // We'll never actually insert undefined due to the checkbox, but
        // undefined as a bson type is deprecated so it might give the wrong
        // impression. We could select any type in the selectbox, so the
        // choice of making it string is arbitrary.
        if (types[0] === 'undefined') {
            return 'string';
        }
        // If there's only one detected type, go with that.
        return (0, csv_utils_1.overrideDetectedFieldType)(types[0]);
    }
    if (types.length === 2) {
        const filtered = types.filter((type) => type !== 'undefined');
        if (filtered.length === 1) {
            // If there are two detected types and one is undefined (ie. an ignored
            // empty string), go with the non-undefined one because undefined values
            // are special-cased during import.
            return (0, csv_utils_1.overrideDetectedFieldType)(filtered[0]);
        }
    }
    // If everything is number-ish (or undefined), go with the made up type
    // 'number'. Behaves much like 'mixed', but makes it a bit clearer to the user
    // what will happen and matches the existing Number entry we have in the field
    // type dropdown.
    if (types.every((type) => ['int', 'long', 'double', 'undefined'].includes(type))) {
        return 'number';
    }
    // otherwise stick with the default 'mixed'
    return field.detected;
}
async function analyzeCSVFields({ input, delimiter, newline, abortSignal, progressCallback, ignoreEmptyStrings, }) {
    const byteCounter = new byte_counter_1.ByteCounter();
    const result = {
        totalRows: 0,
        fields: {},
        aborted: false,
    };
    const parseStream = papaparse_1.default.parse(papaparse_1.default.NODE_STREAM_INPUT, {
        delimiter,
        newline,
    });
    let numRows = 0;
    const analyzeStream = new stream_1.Transform({
        objectMode: true,
        transform: (chunk, encoding, callback) => {
            if (numRows === 0) {
                const headerFields = chunk;
                // There's a quirk in papaparse where it extracts header fields before
                // it finishes auto-detecting the line endings. We could pass in a
                // line ending that we previously detected (in guessFileType(),
                // perhaps?) or we can just strip the extra \r from the final header
                // name if it exists.
                if (headerFields.length) {
                    const lastName = headerFields[headerFields.length - 1];
                    headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
                }
                initResultFields(result, headerFields);
            }
            else {
                addRowToResult(result.fields, result.totalRows, chunk, ignoreEmptyStrings);
                result.totalRows = numRows;
                progressCallback?.({
                    bytesProcessed: byteCounter.total,
                    docsProcessed: result.totalRows,
                });
            }
            ++numRows;
            callback();
        },
    });
    try {
        await (0, promises_1.pipeline)([
            input,
            new utf8_validator_1.Utf8Validator(),
            byteCounter,
            (0, strip_bom_stream_1.default)(),
            parseStream,
            analyzeStream,
        ], ...(abortSignal ? [{ signal: abortSignal }] : []));
    }
    catch (err) {
        if (err.code === 'ABORT_ERR') {
            result.aborted = true;
        }
        else {
            throw err;
        }
    }
    for (const field of Object.values(result.fields)) {
        field.detected = pickFieldType(field);
    }
    return result;
}
//# sourceMappingURL=analyze-csv-fields.js.map