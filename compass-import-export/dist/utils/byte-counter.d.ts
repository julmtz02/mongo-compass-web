/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Transform } from 'stream';
export declare class ByteCounter extends Transform {
    total: number;
    _transform(chunk: Buffer, enc: unknown, cb: (err: null | Error, chunk?: Buffer) => void): void;
}
//# sourceMappingURL=byte-counter.d.ts.map