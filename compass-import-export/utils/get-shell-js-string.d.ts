import type { ExportAggregation, ExportQuery } from '../export/export-types';
export declare function queryAsShellJSString({ ns, query, }: {
    ns: string;
    query: ExportQuery;
}): string;
export declare function aggregationAsShellJSString({ ns, aggregation, }: {
    ns: string;
    aggregation: ExportAggregation;
}): string;
//# sourceMappingURL=get-shell-js-string.d.ts.map