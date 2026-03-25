"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAggregationCursor = createAggregationCursor;
exports.createFindCursor = createFindCursor;
const provider_1 = require("compass-preferences-model/provider");
function createAggregationCursor({ ns, aggregation, dataService, preferences, }) {
    const { stages, options: aggregationOptions = {} } = aggregation;
    aggregationOptions.maxTimeMS = (0, provider_1.capMaxTimeMSAtPreferenceLimit)(preferences, aggregationOptions.maxTimeMS);
    aggregationOptions.promoteValues = false;
    aggregationOptions.bsonRegExp = true;
    return dataService.aggregateCursor(ns, stages, aggregationOptions);
}
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
//# sourceMappingURL=export-cursor.js.map