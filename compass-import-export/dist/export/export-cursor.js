"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFindCursor = exports.createAggregationCursor = void 0;
const provider_1 = require("compass-preferences-model/provider");
function createAggregationCursor({ ns, aggregation, dataService, preferences, }) {
    const { stages, options: aggregationOptions = {} } = aggregation;
    aggregationOptions.maxTimeMS = (0, provider_1.capMaxTimeMSAtPreferenceLimit)(preferences, aggregationOptions.maxTimeMS);
    aggregationOptions.promoteValues = false;
    aggregationOptions.bsonRegExp = true;
    return dataService.aggregateCursor(ns, stages, aggregationOptions);
}
exports.createAggregationCursor = createAggregationCursor;
function createFindCursor({ ns, query, dataService, }) {
    return dataService.findCursor(ns, query.filter ?? {}, {
        projection: query.projection,
        sort: query.sort,
        limit: query.limit,
        skip: query.skip,
        collation: query.collation,
        promoteValues: false,
        bsonRegExp: true,
    });
}
exports.createFindCursor = createFindCursor;
//# sourceMappingURL=export-cursor.js.map