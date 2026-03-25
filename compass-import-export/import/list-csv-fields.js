"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCSVFields = listCSVFields;
const papaparse_1 = __importDefault(require("papaparse"));
const strip_bom_stream_1 = __importDefault(require("strip-bom-stream"));
const logger_1 = require("../utils/logger");
const csv_utils_1 = require("../csv/csv-utils");
const utf8_validator_1 = require("../utils/utf8-validator");
const debug = (0, logger_1.createDebug)('list-csv-fields');
const NUM_PREVIEW_FIELDS = 10;
async function listCSVFields({ input, delimiter, newline, }) {
    return new Promise(function (resolve, reject) {
        let lines = 0;
        const result = {
            uniqueFields: [],
            headerFields: [],
            preview: [],
        };
        const validator = new utf8_validator_1.Utf8Validator();
        validator.once('error', function (err) {
            reject(err);
        });
        input = input.pipe(validator).pipe((0, strip_bom_stream_1.default)());
        papaparse_1.default.parse(input, {
            delimiter,
            newline,
            step: function (results, parser) {
                ++lines;
                debug('listCSVFields:step', lines, results);
                if (lines === 1) {
                    const headerFields = results.data;
                    // There's a quirk in papaparse where it extracts header fields before
                    // it finishes auto-detecting the line endings. We could pass in a
                    // line ending that we previously detected (in guessFileType(),
                    // perhaps?) or we can just strip the extra \r from the final header
                    // name if it exists.
                    if (headerFields.length) {
                        const lastName = headerFields[headerFields.length - 1];
                        headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
                    }
                    result.headerFields = headerFields;
                    // remove array indexes so that foo[0], foo[1] becomes foo
                    // and bar[0].a, bar[1].a becomes bar.a
                    // ie. the whole array counts as one field
                    const flattened = headerFields.map(csv_utils_1.csvHeaderNameToFieldName);
                    const fieldMap = {};
                    // make sure that each array field is only included once
                    for (const name of flattened) {
                        if (!fieldMap[name]) {
                            fieldMap[name] = true;
                            result.uniqueFields.push(name);
                        }
                    }
                    return;
                }
                result.preview.push(results.data);
                if (lines === NUM_PREVIEW_FIELDS + 1) {
                    parser.abort();
                    // Aborting the parser does not destroy the input stream. If we don't
                    // destroy the input stream it will try and read the entire file into
                    // memory.
                    input.destroy();
                }
            },
            complete: function () {
                debug('listCSVFields:complete');
                resolve(result);
            },
            error: function (err) {
                debug('listCSVFields:error', err);
                reject(err);
            },
        });
    });
}
//# sourceMappingURL=list-csv-fields.js.map