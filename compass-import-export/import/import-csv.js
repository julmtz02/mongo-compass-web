"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCSV = importCSV;
const papaparse_1 = __importDefault(require("papaparse"));
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const csv_utils_1 = require("../csv/csv-utils");
const import_utils_1 = require("./import-utils");
const logger_1 = require("../utils/logger");
const debug = (0, logger_1.createDebug)('import-csv');
class CSVTransformer {
    constructor({ fields, ignoreEmptyStrings, }) {
        this.fields = fields;
        this.ignoreEmptyStrings = ignoreEmptyStrings;
        this.headerFields = [];
    }
    addHeaderField(field) {
        this.headerFields.push(field);
    }
    transform(row) {
        if (!this.parsedHeader) {
            // There's a quirk in papaparse where it calls transformHeader()
            // before it finishes auto-detecting the line endings. We could pass
            // in a line ending that we previously detected (in guessFileType(),
            // perhaps?) or we can just strip the extra \r from the final header
            // name if it exists.
            if (this.headerFields.length) {
                const fixupFrom = this.headerFields[this.headerFields.length - 1];
                const fixupTo = fixupFrom.replace(/\r$/, '');
                this.headerFields[this.headerFields.length - 1] = fixupTo;
            }
            this.parsedHeader = {};
            for (const name of this.headerFields) {
                this.parsedHeader[name] = (0, csv_utils_1.parseCSVHeaderName)(name);
            }
            // TODO(COMPASS-7158): make sure array indexes start at 0 and have no
            // gaps, otherwise clean them up (ie. treat those parts as part of the
            // field name). So that you can't have a foo[1000000]
            // edge case.
        }
        return (0, csv_utils_1.makeDocFromCSV)(row, this.headerFields, this.parsedHeader, this.fields, {
            ignoreEmptyStrings: this.ignoreEmptyStrings,
        });
    }
    lineAnnotation(numProcessed) {
        return `[Row ${numProcessed}]`;
    }
}
async function importCSV({ dataService, ns, input, output, abortSignal, progressCallback, errorCallback, delimiter = ',', newline, ignoreEmptyStrings, stopOnErrors, fields, }) {
    debug('importCSV()', { ns: (0, mongodb_ns_1.default)(ns), stopOnErrors });
    if (ns === 'test.compass-import-abort-e2e-test') {
        // Give the test more than enough time to click the abort before we continue.
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const transformer = new CSVTransformer({ fields, ignoreEmptyStrings });
    const parseStream = papaparse_1.default.parse(papaparse_1.default.NODE_STREAM_INPUT, {
        delimiter,
        newline,
        header: true,
        transformHeader: function (header, index) {
            debug('importCSV:transformHeader', header, index);
            transformer.addHeaderField(header);
            return header;
        },
    });
    const streams = [parseStream];
    return await (0, import_utils_1.doImport)(input, streams, transformer, {
        dataService,
        ns,
        output,
        abortSignal,
        progressCallback,
        errorCallback,
        stopOnErrors,
    });
}
//# sourceMappingURL=import-csv.js.map