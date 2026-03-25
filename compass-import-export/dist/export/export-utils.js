"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColumnRecorder = exports.lookupValueForPath = void 0;
const lodash_1 = __importDefault(require("lodash"));
const csv_utils_1 = require("../csv/csv-utils");
function lookupValueForPath(row, path, allowObjectsAndArrays) {
    /*
    Descend along objects and arrays to find a BSON value (ie. something that's
    not an object or an array) that we can stringify and put in a field.
    It is possible that not all docs have the same structure which is where we
    sometimes return undefined below.
  
    Imagine a collection:
    {foo: ['x']}
    {foo: { bar: 'y' }}
    {foo: 'z'}
  
    It would have the following columns:
    foo[0]
    foo.bar
    foo
  
    For each of the documents above it will return a string for one of the columns
    and undefined for the other two. Unless allowObjectsAndArrays is true, then
    the path "foo" will always return something that's not undefined. This is so
    we can support optionally serializing arrays and objects as EJSON strings.
    */
    let value = row;
    for (const part of path) {
        if (part.type === 'index') {
            if (Array.isArray(value)) {
                value = value[part.index];
            }
            else {
                return undefined;
            }
        }
        else {
            if (lodash_1.default.isPlainObject(value)) {
                value = value[part.name];
            }
            else {
                return undefined;
            }
        }
    }
    if (allowObjectsAndArrays) {
        return value;
    }
    if (Array.isArray(value)) {
        return undefined;
    }
    if (lodash_1.default.isPlainObject(value)) {
        return undefined;
    }
    return value;
}
exports.lookupValueForPath = lookupValueForPath;
class ColumnRecorder {
    constructor() {
        this.columnCache = {};
        this.columns = [];
    }
    cacheKey(path) {
        // something that will make Record<> happy
        return JSON.stringify(path);
    }
    findInsertIndex(path) {
        const headerName = (0, csv_utils_1.formatCSVHeaderName)(path);
        const fieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(headerName);
        let lastIndex = -1;
        for (const [columnIndex, column] of this.columns.entries()) {
            const columnHeaderName = (0, csv_utils_1.formatCSVHeaderName)(column);
            const columnFieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(columnHeaderName);
            if (columnFieldName === fieldName) {
                lastIndex = columnIndex;
            }
        }
        if (lastIndex !== -1) {
            return lastIndex + 1;
        }
        return this.columns.length;
    }
    addToColumns(value, path = []) {
        // Something to keep in mind is that with arrays and objects we could
        // potentially have an enormous amount of distinct paths. In that case we
        // might want to either error or just EJSON.stringify() the top-level field.
        if (Array.isArray(value)) {
            for (const [index, child] of value.entries()) {
                this.addToColumns(child, [...path, { type: 'index', index }]);
            }
        }
        else if (lodash_1.default.isPlainObject(value)) {
            for (const [name, child] of Object.entries(value)) {
                this.addToColumns(child, [...path, { type: 'field', name }]);
            }
        }
        else {
            const cacheKey = this.cacheKey(path);
            if (!this.columnCache[cacheKey]) {
                this.columnCache[cacheKey] = true;
                this.columns.splice(this.findInsertIndex(path), 0, path);
            }
        }
    }
}
exports.ColumnRecorder = ColumnRecorder;
//# sourceMappingURL=export-utils.js.map