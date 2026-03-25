import type { Document } from 'bson';
import type { Delimiter, Linebreak, PathPart, CSVDetectableFieldType, CSVParsableFieldType, IncludedFields, CSVValue, CSVFieldTypeInfo } from './csv-types';
export declare function formatCSVValue(value: string, { delimiter, escapeLinebreaks, }: {
    delimiter: Delimiter;
    escapeLinebreaks?: boolean;
}): string;
export declare function formatCSVLine(values: string[], { delimiter, linebreak, }: {
    delimiter: Delimiter;
    linebreak: Linebreak;
}): string;
export declare function stringifyCSVValue(value: any, { delimiter, }: {
    delimiter: Delimiter;
}): string;
export declare function csvHeaderNameToFieldName(name: string): string;
export declare function detectCSVFieldType(value: string, name: string, ignoreEmptyStrings?: boolean): CSVDetectableFieldType | 'undefined';
export declare function placeValue(doc: Document, path: PathPart[], value: any, overwrite?: boolean): any;
export declare function overrideDetectedFieldType(fieldType: CSVParsableFieldType): "string" | "number" | "boolean" | "int" | "long" | "double" | "date" | "objectId" | "uuid" | "minKey" | "maxKey" | "ejson" | "null" | "binData" | "md5" | "timestamp" | "decimal" | "mixed";
export declare function makeDocFromCSV(chunk: Record<string, string>, header: string[], parsedHeader: Record<string, PathPart[]>, included: IncludedFields, { ignoreEmptyStrings }: {
    ignoreEmptyStrings?: boolean;
}): Document;
export declare function parseCSVValue(value: string, type: CSVParsableFieldType): CSVValue;
export declare function parseCSVHeaderName(value: string): PathPart[];
export declare function formatCSVHeaderName(path: PathPart[]): string;
export declare function isCompatibleCSVFieldType(selectedType: CSVParsableFieldType, type: CSVParsableFieldType | 'undefined'): boolean;
export declare function findBrokenCSVTypeExample(types: Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>, selectedType: CSVParsableFieldType): CSVFieldTypeInfo | null;
//# sourceMappingURL=csv-utils.d.ts.map