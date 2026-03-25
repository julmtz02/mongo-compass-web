import React from 'react';
import type { FieldsToExportOption, FieldsToExport } from '../modules/export';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
export declare const codeElementId = "export-collection-code-preview-wrapper";
type ExportCodeViewProps = {
    ns: string;
    query?: ExportQuery;
    aggregation?: ExportAggregation;
    fields: FieldsToExport;
    selectedFieldOption: FieldsToExportOption;
};
declare function ExportCodeView({ ns, query, aggregation, fields, selectedFieldOption, }: ExportCodeViewProps): React.JSX.Element;
declare const ConnectedExportCodeView: import("react-redux").ConnectedComponent<typeof ExportCodeView, {
    context?: import("react-redux/es/components/Context").ReactReduxContextInstance | undefined;
    store?: import("redux").Store | undefined;
}>;
export { ExportCodeView as UnconnectedExportCodeView };
export { ConnectedExportCodeView as ExportCodeView };
//# sourceMappingURL=export-code-view.d.ts.map