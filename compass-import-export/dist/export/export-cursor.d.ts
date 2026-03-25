import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ExportAggregation, ExportQuery } from './export-types';
export declare function createAggregationCursor({ ns, aggregation, dataService, preferences, }: {
    ns: string;
    dataService: Pick<DataService, 'aggregateCursor'>;
    preferences: PreferencesAccess;
    aggregation: ExportAggregation;
}): import("mongodb").AggregationCursor<any>;
export declare function createFindCursor({ ns, query, dataService, }: {
    ns: string;
    dataService: Pick<DataService, 'findCursor'>;
    query: ExportQuery;
}): import("mongodb").FindCursor<any>;
//# sourceMappingURL=export-cursor.d.ts.map