import type { Action, Reducer } from 'redux';
import type { SchemaPath } from '../export/gather-fields';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import type { ExportJSONFormat } from '../export/export-json';
import type { ExportThunkAction } from '../stores/export-store';
export type FieldsToExport = {
    [fieldId: string]: {
        path: SchemaPath;
        selected: boolean;
    };
};
export declare function getIdForSchemaPath(schemaPath: SchemaPath): string;
type ExportOptions = {
    namespace: string;
    query: ExportQuery | undefined;
    exportFullCollection?: boolean;
    aggregation?: ExportAggregation;
    fieldsToExport: FieldsToExport;
    selectedFieldOption: FieldsToExportOption;
};
export type ExportStatus = undefined | 'select-field-options' | 'select-fields-to-export' | 'ready-to-export' | 'select-file-output' | 'in-progress';
export type FieldsToExportOption = 'all-fields' | 'select-fields';
export type ExportState = {
    isOpen: boolean;
    connectionId: string;
    isInProgressMessageOpen: boolean;
    status: ExportStatus;
    fieldsAddedCount: number;
    errorLoadingFieldsToExport: string | undefined;
    fieldsToExportAbortController: AbortController | undefined;
    exportAbortController: AbortController | undefined;
    exportFileError: string | undefined;
} & ExportOptions;
export declare const initialState: ExportState;
export declare const enum ExportActionTypes {
    OpenExport = "compass-import-export/export/OpenExport",
    CloseExport = "compass-import-export/export/CloseExport",
    CloseInProgressMessage = "compass-import-export/export/CloseInProgressMessage",
    BackToSelectFieldOptions = "compass-import-export/export/BackToSelectFieldOptions",
    BackToSelectFieldsToExport = "compass-import-export/export/BackToSelectFieldsToExport",
    ReadyToExport = "compass-import-export/export/ReadyToExport",
    ToggleFieldToExport = "compass-import-export/export/ToggleFieldToExport",
    AddFieldToExport = "compass-import-export/export/AddFieldToExport",
    ToggleExportAllSelectedFields = "compass-import-export/export/ToggleExportAllSelectedFields",
    SelectFieldsToExport = "compass-import-export/export/SelectFieldsToExport",
    FetchFieldsToExport = "compass-import-export/export/FetchFieldsToExport",
    FetchFieldsToExportSuccess = "compass-import-export/export/FetchFieldsToExportSuccess",
    FetchFieldsToExportError = "compass-import-export/export/FetchFieldsToExportError",
    RunExport = "compass-import-export/export/RunExport",
    ExportFileError = "compass-import-export/export/ExportFileError",
    CancelExport = "compass-import-export/export/CancelExport",
    RunExportError = "compass-import-export/export/RunExportError",
    RunExportSuccess = "compass-import-export/export/RunExportSuccess"
}
type OpenExportAction = {
    type: ExportActionTypes.OpenExport;
    connectionId: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
} & Omit<ExportOptions, 'fieldsToExport' | 'selectedFieldOption'>;
export declare const openExport: (exportOptions: Omit<OpenExportAction, "type">) => ExportThunkAction<void, OpenExportAction>;
type CloseExportAction = {
    type: ExportActionTypes.CloseExport;
};
export declare const connectionDisconnected: (connectionId: string) => ExportThunkAction<void>;
export declare const closeExport: () => CloseExportAction;
type CloseInProgressMessageAction = {
    type: ExportActionTypes.CloseInProgressMessage;
};
export declare const closeInProgressMessage: () => CloseInProgressMessageAction;
type SelectFieldsToExportAction = {
    type: ExportActionTypes.SelectFieldsToExport;
};
type BackToSelectFieldOptionsAction = {
    type: ExportActionTypes.BackToSelectFieldOptions;
};
export declare const backToSelectFieldOptions: () => BackToSelectFieldOptionsAction;
type BackToSelectFieldsToExportAction = {
    type: ExportActionTypes.BackToSelectFieldsToExport;
};
export declare const backToSelectFieldsToExport: () => BackToSelectFieldsToExportAction;
type FetchFieldsToExportAction = {
    type: ExportActionTypes.FetchFieldsToExport;
    fieldsToExportAbortController: AbortController;
};
type FetchFieldsToExportErrorAction = {
    type: ExportActionTypes.FetchFieldsToExportError;
    errorMessage?: string;
};
type FetchFieldsToExportSuccessAction = {
    type: ExportActionTypes.FetchFieldsToExportSuccess;
    fieldsToExport: FieldsToExport;
    aborted?: boolean;
};
export declare const toggleFieldToExport: (fieldId: string) => {
    type: ExportActionTypes;
    fieldId: string;
};
export declare const toggleExportAllSelectedFields: () => {
    type: ExportActionTypes;
};
export declare const addFieldToExport: (path: SchemaPath) => {
    type: ExportActionTypes;
    path: SchemaPath;
};
type ReadyToExportAction = {
    type: ExportActionTypes.ReadyToExport;
    selectedFieldOption?: 'all-fields';
};
export declare const readyToExport: () => ReadyToExportAction;
type CancelExportAction = {
    type: ExportActionTypes.CancelExport;
};
export declare const cancelExport: () => CancelExportAction;
export declare const selectFieldsToExport: () => ExportThunkAction<Promise<void>, SelectFieldsToExportAction | FetchFieldsToExportAction | FetchFieldsToExportErrorAction | FetchFieldsToExportSuccessAction>;
export declare const runExport: ({ filePath, fileType, jsonFormatVariant, }: {
    filePath: string;
    fileType: "csv" | "json";
    jsonFormatVariant: ExportJSONFormat;
}) => ExportThunkAction<Promise<void>>;
export declare const exportReducer: Reducer<ExportState, Action>;
export {};
//# sourceMappingURL=export.d.ts.map