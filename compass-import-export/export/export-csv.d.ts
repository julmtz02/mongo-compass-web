import type { Readable, Writable } from 'stream';
import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ExportAggregation, ExportQuery, ExportResult } from './export-types';
import type { Delimiter, Linebreak, PathPart } from '../csv/csv-types';
export type CSVExportPhase = 'DOWNLOAD' | 'WRITE';
export type ProgressCallback = (index: number, phase: CSVExportPhase) => void;
type ExportCSVOptions = {
    input: Readable;
    columns: PathPart[][];
    output: Writable;
    abortSignal?: AbortSignal;
    progressCallback?: ProgressCallback;
    delimiter?: Delimiter;
    linebreak?: Linebreak;
};
export declare function exportCSVFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }: Omit<ExportCSVOptions, 'input' | 'columns'> & {
    ns: string;
    dataService: Pick<DataService, 'aggregateCursor'>;
    preferences: PreferencesAccess;
    aggregation: ExportAggregation;
}): Promise<ExportResult>;
export declare function exportCSVFromQuery({ ns, query, dataService, ...exportOptions }: Omit<ExportCSVOptions, 'input' | 'columns'> & {
    ns: string;
    dataService: Pick<DataService, 'findCursor'>;
    query?: ExportQuery;
}): Promise<ExportResult>;
export {};
//# sourceMappingURL=export-csv.d.ts.map