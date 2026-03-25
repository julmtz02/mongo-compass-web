import React from 'react';
import type { FieldsToExport } from '../modules/export';
import type { SchemaPath } from '../export/gather-fields';
type ExportSelectFieldsProps = {
    isLoading: boolean;
    errorLoadingFieldsToExport?: string;
    fields: FieldsToExport;
    selectFieldsToExport: () => void;
    addFieldToExport: (path: SchemaPath) => void;
    toggleFieldToExport: (fieldId: string, selected: boolean) => void;
    toggleExportAllSelectedFields: () => void;
};
declare function ExportSelectFields({ errorLoadingFieldsToExport, isLoading, fields, addFieldToExport, selectFieldsToExport, toggleFieldToExport, toggleExportAllSelectedFields, }: ExportSelectFieldsProps): React.JSX.Element;
declare const ConnectedExportSelectFields: import("react-redux").ConnectedComponent<typeof ExportSelectFields, {
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export { ConnectedExportSelectFields as ExportSelectFields, ExportSelectFields as UnconnectedExportSelectFields, };
//# sourceMappingURL=export-select-fields.d.ts.map