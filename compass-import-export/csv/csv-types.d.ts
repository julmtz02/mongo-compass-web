import type { Double, Int32, Long, Binary, BSONRegExp, ObjectId, Timestamp, Decimal128, UUID, MinKey, MaxKey } from 'bson';
export declare const supportedDelimiters: readonly [",", "\t", ";", " "];
export type Delimiter = (typeof supportedDelimiters)[number];
export declare const supportedLinebreaks: readonly ["\r\n", "\n"];
export type Linebreak = (typeof supportedLinebreaks)[number];
export declare const detectableFieldTypes: readonly ["int", "long", "double", "boolean", "date", "string", "objectId", "uuid", "regex", "minKey", "maxKey", "ejson", "null"];
export type CSVDetectableFieldType = (typeof detectableFieldTypes)[number];
export declare const parsableFieldTypes: readonly ["int", "long", "double", "boolean", "date", "string", "objectId", "uuid", "regex", "minKey", "maxKey", "ejson", "null", "binData", "md5", "timestamp", "decimal", "number", "mixed"];
export type CSVParsableFieldType = (typeof parsableFieldTypes)[number];
export declare const CSVFieldTypeLabels: Record<CSVParsableFieldType, string>;
export type IncludedFields = Record<string, CSVParsableFieldType>;
export type CSVValue = Double | Int32 | Long | Date | boolean | string | null | Binary | Timestamp | ObjectId | BSONRegExp | Decimal128 | UUID | MinKey | MaxKey;
export type PathPart = {
    type: 'index';
    index: number;
} | {
    type: 'field';
    name: string;
};
export type CSVFieldTypeInfo = {
    count: number;
    firstRowIndex: number;
    firstColumnIndex: number;
    firstValue: string;
};
export type CSVField = {
    types: Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>;
    columnIndexes: number[];
    detected: CSVParsableFieldType;
};
//# sourceMappingURL=csv-types.d.ts.map