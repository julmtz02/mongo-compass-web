import type { Writable } from 'stream';
import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { AggregationCursor, FindCursor } from 'mongodb';
import type { ExportAggregation, ExportQuery, ExportResult } from './export-types';
export type ExportJSONFormat = 'default' | 'relaxed' | 'canonical';
type ExportJSONOptions = {
    output: Writable;
    abortSignal?: AbortSignal;
    input: FindCursor | AggregationCursor;
    progressCallback?: (index: number) => void;
    variant: ExportJSONFormat;
};
export declare function exportJSON({ output, abortSignal, input, progressCallback, variant, }: ExportJSONOptions): Promise<ExportResult>;
export declare function exportJSONFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }: Omit<ExportJSONOptions, 'input'> & {
    ns: string;
    dataService: Pick<DataService, 'aggregateCursor'>;
    preferences: PreferencesAccess;
    aggregation: ExportAggregation;
}): Promise<ExportResult>;
export declare function exportJSONFromQuery({ ns, query, dataService, ...exportOptions }: Omit<ExportJSONOptions, 'input'> & {
    ns: string;
    dataService: Pick<DataService, 'findCursor'>;
    query?: ExportQuery;
}): Promise<ExportResult>;
export {};
//# sourceMappingURL=export-json.d.ts.map