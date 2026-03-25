import { Transform } from 'stream';
import util from 'util';
export declare class Utf8Validator extends Transform {
    decoder: util.TextDecoder;
    _transform(chunk: Buffer, enc: unknown, cb: (err: null | Error, chunk?: Buffer) => void): void;
    _flush(cb: (err: null | Error, chunk?: Buffer) => void): void;
}
//# sourceMappingURL=utf8-validator.d.ts.map