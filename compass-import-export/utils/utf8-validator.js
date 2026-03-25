"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utf8Validator = void 0;
const stream_1 = require("stream");
const util_1 = __importDefault(require("util"));
class Utf8Validator extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.decoder = new util_1.default.TextDecoder('utf8', { fatal: true, ignoreBOM: true });
    }
    _transform(chunk, enc, cb) {
        try {
            this.decoder.decode(chunk, { stream: true });
        }
        catch (err) {
            cb(err);
            return;
        }
        cb(null, chunk);
    }
    _flush(cb) {
        try {
            this.decoder.decode(new Uint8Array());
        }
        catch (err) {
            cb(err);
            return;
        }
        cb(null);
    }
}
exports.Utf8Validator = Utf8Validator;
//# sourceMappingURL=utf8-validator.js.map