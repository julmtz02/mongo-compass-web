"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteCounter = void 0;
const stream_1 = require("stream");
class ByteCounter extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.total = 0;
    }
    _transform(chunk, enc, cb) {
        this.total += chunk.length;
        cb(null, chunk);
    }
}
exports.ByteCounter = ByteCounter;
//# sourceMappingURL=byte-counter.js.map