"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryHasProjection = void 0;
function queryHasProjection(query) {
    return Object.keys(query?.projection || {}).length > 0;
}
exports.queryHasProjection = queryHasProjection;
//# sourceMappingURL=query-has-projection.js.map