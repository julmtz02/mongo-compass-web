"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAsShellJSString = queryAsShellJSString;
exports.aggregationAsShellJSString = aggregationAsShellJSString;
const lodash_1 = __importDefault(require("lodash"));
const mongodb_query_parser_1 = require("mongodb-query-parser");
const mongodb_ns_1 = __importDefault(require("mongodb-ns"));
const compass_editor_1 = require("@mongodb-js/compass-editor");
const codeFormatting = {
    singleQuote: true,
};
function queryAsShellJSString({ ns, query, }) {
    let ret = `db.getCollection("${(0, mongodb_ns_1.default)(ns).collection}").find(`;
    ret += `${(0, mongodb_query_parser_1.stringify)(query.filter ? query.filter : {}) || ''}`;
    if (query.projection) {
        ret += `,${(0, mongodb_query_parser_1.stringify)(query.projection) || ''}`;
    }
    ret += ')';
    if (query.collation) {
        ret += `.collation(${(0, mongodb_query_parser_1.stringify)(query.collation) || ''})`;
    }
    if (query.sort) {
        ret += `.sort(${lodash_1.default.isObject(query.sort) && !Array.isArray(query.sort)
            ? (0, mongodb_query_parser_1.stringify)(query.sort) || ''
            : JSON.stringify(query.sort)})`;
    }
    if (query.limit) {
        ret += `.limit(${query.limit})`;
    }
    if (query.skip) {
        ret += `.skip(${query.skip})`;
    }
    return (0, compass_editor_1.prettify)(ret, 'javascript', codeFormatting);
}
function aggregationAsShellJSString({ ns, aggregation, }) {
    const { stages, options = {} } = aggregation;
    let ret = `db.getCollection("${(0, mongodb_ns_1.default)(ns).collection}").aggregate([`;
    for (const [index, stage] of stages.entries()) {
        ret += `${(0, mongodb_query_parser_1.stringify)(stage) || ''}${index === stages.length - 1 ? '' : ','}`;
    }
    ret += ']';
    if (Object.keys(options).length > 0) {
        ret += ',';
        const filteredOptions = Object.fromEntries(Object.entries(options).filter((option) => option[1] !== undefined));
        ret += (0, mongodb_query_parser_1.stringify)(filteredOptions);
    }
    ret += ');';
    return (0, compass_editor_1.prettify)(ret, 'javascript', codeFormatting);
}
//# sourceMappingURL=get-shell-js-string.js.map