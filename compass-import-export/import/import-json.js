"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importJSON = importJSON;
const bson_1 = require("bson");
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const Parser_1 = __importDefault(require("stream-json/Parser"));
const StreamArray_1 = __importDefault(require("stream-json/streamers/StreamArray"));
const StreamValues_1 = __importDefault(require("stream-json/streamers/StreamValues"));
const import_utils_1 = require("./import-utils");
const logger_1 = require("../utils/logger");
const debug = (0, logger_1.createDebug)('import-json');
class JSONTransformer {
    transform(chunk) {
        // make sure files parsed as jsonl only contain objects with no arrays and simple values
        // (this will either stop the entire import and throw or just skip this
        // one value depending on the value of stopOnErrors)
        if (Object.prototype.toString.call(chunk.value) !== '[object Object]') {
            throw new Error('Value is not an object');
        }
        return bson_1.EJSON.deserialize(chunk.value, {
            relaxed: false,
        });
    }
    lineAnnotation(numProcessed) {
        return ` [Index ${numProcessed - 1}]`;
    }
}
async function importJSON({ dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, input, jsonVariant, }) {
    debug('importJSON()', { ns: (0, mongodb_ns_1.default)(ns) });
    if (ns === 'test.compass-import-abort-e2e-test') {
        // Give the test more than enough time to click the abort before we continue.
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const transformer = new JSONTransformer();
    const streams = [];
    if (jsonVariant === 'jsonl') {
        streams.push(Parser_1.default.parser({ jsonStreaming: true }));
        streams.push(StreamValues_1.default.streamValues());
    }
    else {
        streams.push(Parser_1.default.parser());
        streams.push(StreamArray_1.default.streamArray());
    }
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
//# sourceMappingURL=import-json.js.map