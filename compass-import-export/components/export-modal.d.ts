import React from 'react';
import type { ExportStatus, FieldsToExportOption } from '../modules/export';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import type { ExportJSONFormat } from '../export/export-json';
type ExportModalProps = {
    ns: string;
    isOpen: boolean;
    query?: ExportQuery;
    exportFullCollection?: boolean;
    aggregation?: ExportAggregation;
    selectedFieldOption: FieldsToExportOption;
    isFieldsToExportLoading: boolean;
    selectFieldsToExport: () => void;
    readyToExport: (selectedFieldOption?: 'all-fields') => void;
    runExport: (exportOptions: {
        filePath: string;
        fileType: 'csv' | 'json';
        jsonFormatVariant: ExportJSONFormat;
    }) => void;
    backToSelectFieldOptions: () => void;
    backToSelectFieldsToExport: () => void;
    closeExport: () => void;
    status: ExportStatus;
    exportFileError: string | undefined;
};
declare function ExportModal({ ns, query, aggregation, exportFileError, exportFullCollection, isFieldsToExportLoading, selectedFieldOption, selectFieldsToExport, readyToExport, runExport, isOpen, closeExport, status, backToSelectFieldOptions, backToSelectFieldsToExport, }: ExportModalProps): React.JSX.Element;
declare const ConnectedExportModal: import("react-redux").ConnectedComponent<typeof ExportModal, {
    context?: import("react-redux/es/components/Context").ReactReduxContextInstance | undefined;
    store?: import("redux").Store | undefined;
}>;
export { ConnectedExportModal as ExportModal, ExportModal as UnconnectedExportModal, };
//# sourceMappingURL=export-modal.d.ts.map