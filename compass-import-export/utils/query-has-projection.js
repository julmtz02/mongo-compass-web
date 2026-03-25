"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryHasProjection = queryHasProjection;
function queryHasProjection(query) {
    return Object.keys(query?.projection || {}).length > 0;
}
//# sourceMappingURL=query-has-projection.js.map