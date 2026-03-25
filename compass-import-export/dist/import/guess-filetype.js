"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessFileType = void 0;
const stream_1 = require("stream");
const util_1 = __importDefault(require("util"));
const papaparse_1 = __importDefault(require("papaparse"));
const stream_json_1 = __importDefault(require("stream-json"));
const logger_1 = require("../utils/logger");
const csv_types_1 = require("../csv/csv-types");
const debug = (0, logger_1.createDebug)('import-guess-filetype');
function detectJSON(input) {
    return new Promise(function (resolve) {
        const parser = stream_json_1.default.parser();
        let found = false;
        parser.once('data', (data) => {
            debug('detectJSON:data', data);
            let jsonVariant = null;
            if (data.name === 'startObject') {
                jsonVariant = 'jsonl';
            }
            else if (data.name === 'startArray') {
                jsonVariant = 'json';
            }
            found = true;
            input.destroy();
            resolve(jsonVariant);
        });
        parser.on('end', () => {
            debug('detectJSON:end');
            if (!found) {
                found = true;
                // reached the end before a full doc
                input.destroy();
                resolve(null);
            }
        });
        parser.on('close', (err) => {
            debug('detectJSON:close', err);
            if (!found) {
                found = true;
                // stream closed before a full doc
                input.destroy();
                resolve(null);
            }
        });
        parser.on('error', (err) => {
            debug('detectJSON:error', err);
            if (!found) {
                found = true;
                // got an error before a full doc
                input.destroy();
                resolve(null);
            }
        });
        input.pipe(parser);
    });
}
function hasDelimiterError({ data, errors, }) {
    // papaparse gets weird when there's only one header field. It might find a
    // space in the second line and go with that. So rather go with our own
    // delimiter detection code in this case.
    if (data.length < 2) {
        return true;
    }
    return (errors.find((error) => error.code === 'UndetectableDelimiter') !== undefined);
}
function redetectDelimiter({ data }) {
    for (const char of data[0]) {
        if (csv_types_1.supportedDelimiters.includes(char)) {
            return char;
        }
    }
    return ',';
}
function detectCSV(input, jsonPromise) {
    let csvDelimiter = null;
    let lines = 0;
    let found = false;
    // stop processing CSV as soon as we detect JSON
    const jsonDetected = new Promise(function (resolve) {
        jsonPromise
            .then((jsonType) => {
            if (jsonType) {
                input.destroy();
                resolve(null);
            }
        })
            .catch(() => {
            // if the file was not valid JSON, then ignore this because either CSV
            // detection will eventually succeed FileSizeEnforcer will error
        });
    });
    return Promise.race([
        jsonDetected,
        new Promise(function (resolve) {
            papaparse_1.default.parse(input, {
                // NOTE: parsing without header: true otherwise the delimiter detection
                // can't fail and will always detect ,
                delimitersToGuess: csv_types_1.supportedDelimiters,
                step: function (results) {
                    ++lines;
                    debug('detectCSV:step', lines, results);
                    if (lines === 1) {
                        if (hasDelimiterError(results)) {
                            csvDelimiter = redetectDelimiter(results);
                        }
                        else {
                            csvDelimiter = results.meta.delimiter;
                        }
                    }
                    // must be at least two lines for header row and data
                    if (lines === 2) {
                        found = true;
                        debug('detectCSV:complete');
                        input.destroy();
                        resolve(lines === 2 ? csvDelimiter : null);
                    }
                },
                complete: function () {
                    debug('detectCSV:complete');
                    if (!found) {
                        found = true;
                        // we reached the end before two lines
                        input.destroy();
                        resolve(null);
                    }
                },
                error: function (err) {
                    debug('detectCSV:error', err);
                    if (!found) {
                        found = true;
                        // something failed before we got to the end of two lines
                        input.destroy();
                        resolve(null);
                    }
                },
            });
        }),
    ]);
}
const MAX_LENGTH = 1000000;
class FileSizeEnforcer extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.length = 0;
    }
    _transform(chunk, enc, cb) {
        this.length += chunk.length;
        if (this.length > MAX_LENGTH) {
            cb(new Error(`CSV still not detected after ${MAX_LENGTH} bytes`));
        }
        else {
            cb(null, chunk);
        }
    }
}
class NewlineDetector extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.chunks = [];
        this.decoder = new util_1.default.TextDecoder('utf8', { fatal: true, ignoreBOM: true });
    }
    _transform(chunk, enc, cb) {
        try {
            /*
            It might look like this is going to store the entire file in memory, but
            this whole process will stop the moment it detects either JSON (which
            happens nearly immediately if that's the case) or when it detects CSV
            (which happens as soon as we hit two lines). If it doesn't detect either
            of those, then FileSizeEnforcer will kick in, we'll find Unknown and the
            process also stops.
      
            But just in case someone thinks this is generic enough to use in any
            situation, we're not exporting this class so it will only be used here.
            */
            this.chunks.push(this.decoder.decode(chunk, { stream: true }));
        }
        catch (err) {
            cb(err);
            return;
        }
        cb(null, chunk);
    }
    _flush(cb) {
        try {
            this.chunks.push(this.decoder.decode(new Uint8Array()));
        }
        catch (err) {
            cb(err);
            return;
        }
        cb(null);
    }
    detectNewline() {
        const text = this.chunks.join('');
        const firstRN = text.indexOf('\r\n');
        const firstN = text.indexOf('\n');
        if (firstRN !== -1 && firstRN < firstN) {
            // If there is a \r\n then there most be a \n , so firstN is never -1. But
            // there might have been a \n even earlier.
            return '\r\n';
        }
        // Either there is only a \n in which case we go with that, or there are no
        // line endings in which case we just go with a default of \n as it won't
        // matter because there are no lines to split anyway.
        return '\n';
    }
}
function guessFileType({ input, }) {
    return new Promise((resolve, reject) => {
        void (async () => {
            const newlineDetector = new NewlineDetector();
            input = input.pipe(newlineDetector);
            input.once('error', function (err) {
                reject(err);
            });
            const jsStream = input.pipe(new stream_1.PassThrough());
            const csvStream = input
                .pipe(new stream_1.PassThrough())
                .pipe(new FileSizeEnforcer());
            const jsonPromise = detectJSON(jsStream);
            const [jsonVariant, csvDelimiter] = await Promise.all([
                jsonPromise,
                detectCSV(csvStream, jsonPromise),
            ]);
            // keep streaming until both promises resolved, then destroy the input
            // stream to stop further processing
            input.destroy();
            debug('guessFileType', jsonVariant, csvDelimiter);
            // check JSON first because practically anything will parse as CSV
            if (jsonVariant) {
                resolve({ type: jsonVariant });
                return;
            }
            if (csvDelimiter) {
                const newline = newlineDetector.detectNewline();
                resolve({ type: 'csv', csvDelimiter, newline });
                return;
            }
            resolve({ type: 'unknown' });
        })();
    });
}
exports.guessFileType = guessFileType;
//# sourceMappingURL=guess-filetype.js.map