import type { Document } from 'mongodb';
import type { PathPart } from '../csv/csv-types';
export declare function lookupValueForPath(row: Document, path: PathPart[], allowObjectsAndArrays?: boolean): any;
export declare class ColumnRecorder {
    columnCache: Record<string, true>;
    columns: PathPart[][];
    constructor();
    cacheKey(path: PathPart[]): string;
    findInsertIndex(path: PathPart[]): number;
    addToColumns(value: any, path?: PathPart[]): void;
}
//# sourceMappingURL=export-utils.d.ts.map