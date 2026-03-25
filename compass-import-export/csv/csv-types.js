"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVFieldTypeLabels = exports.parsableFieldTypes = exports.detectableFieldTypes = exports.supportedLinebreaks = exports.supportedDelimiters = void 0;
exports.supportedDelimiters = [',', '\t', ';', ' '];
exports.supportedLinebreaks = ['\r\n', '\n'];
// the subset of bson types that we can detect
exports.detectableFieldTypes = [
    'int',
    'long',
    'double',
    'boolean',
    'date',
    'string',
    'objectId',
    'uuid',
    'regex',
    'minKey',
    'maxKey',
    // ejson is not a real type, but the fallback for otherwise unserializable
    // values like javascript, javascriptWithCode, DBRef (which itself is just a
    // convention, not a type) and whatever new types get added. It also covers
    // arrays and objects exported by mongoexport. So we detect those as ejson and
    // then we can import them.
    'ejson',
    'null',
];
// NOTE: 'undefined' exists internally for ignored empty strings, but it is
// deprecated as a bson type so we can't actually parse it, so it is left out of
// detectable and parsable field types.
// the subset of bson types that we can parse
exports.parsableFieldTypes = [
    ...exports.detectableFieldTypes,
    'binData',
    'md5',
    'timestamp',
    'decimal',
    'number', // like 'mixed', but for use when everything is an int, long or double.
    'mixed',
];
exports.CSVFieldTypeLabels = {
    int: 'Int32',
    long: 'Long',
    double: 'Double',
    boolean: 'Boolean',
    date: 'Date',
    string: 'String',
    null: 'Null',
    objectId: 'ObjectId',
    binData: 'Binary',
    uuid: 'UUID',
    md5: 'MD5',
    timestamp: 'Timestamp',
    decimal: 'Decimal128',
    regex: 'RegExpr',
    minKey: 'MinKey',
    maxKey: 'MaxKey',
    ejson: 'EJSON',
    number: 'Number',
    mixed: 'Mixed',
};
//# sourceMappingURL=csv-types.js.map