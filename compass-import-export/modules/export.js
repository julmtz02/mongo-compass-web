"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReducer = exports.runExport = exports.selectFieldsToExport = exports.cancelExport = exports.readyToExport = exports.addFieldToExport = exports.toggleExportAllSelectedFields = exports.toggleFieldToExport = exports.backToSelectFieldsToExport = exports.backToSelectFieldOptions = exports.closeInProgressMessage = exports.closeExport = exports.connectionDisconnected = exports.openExport = exports.initialState = void 0;
exports.getIdForSchemaPath = getIdForSchemaPath;
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const gather_fields_1 = require("../export/gather-fields");
const query_has_projection_1 = require("../utils/query-has-projection");
const export_csv_1 = require("../export/export-csv");
const export_toast_1 = require("../components/export-toast");
const export_json_1 = require("../export/export-json");
function getIdForSchemaPath(schemaPath) {
    return JSON.stringify(schemaPath);
}
function isAction(action, type) {
    return action.type === type;
}
exports.initialState = {
    isOpen: false,
    connectionId: '',
    isInProgressMessageOpen: false,
    status: undefined,
    namespace: '',
    query: {
        filter: {},
    },
    fieldsAddedCount: 0,
    errorLoadingFieldsToExport: undefined,
    fieldsToExport: {},
    fieldsToExportAbortController: undefined,
    selectedFieldOption: 'all-fields',
    exportFullCollection: undefined,
    aggregation: undefined,
    exportAbortController: undefined,
    exportFileError: undefined,
};
const openExport = (exportOptions) => {
    return (dispatch, _getState, { track, connections }) => {
        track('Export Opened', {
            type: exportOptions.aggregation ? 'aggregation' : 'query',
            origin: exportOptions.origin,
        }, connections.getConnectionById(exportOptions.connectionId)?.info);
        dispatch({
            type: "compass-import-export/export/OpenExport" /* ExportActionTypes.OpenExport */,
            ...exportOptions,
        });
    };
};
exports.openExport = openExport;
const connectionDisconnected = (connectionId) => {
    return (dispatch, getState, { logger: { debug } }) => {
        const currentConnectionId = getState().export.connectionId;
        debug('connectionDisconnected', { connectionId, currentConnectionId });
        if (connectionId === currentConnectionId) {
            // unlike cancelExport() close also cancels fieldsToExportAbortController
            // and it hides the modal
            dispatch((0, exports.closeExport)());
        }
    };
};
exports.connectionDisconnected = connectionDisconnected;
const closeExport = () => ({
    type: "compass-import-export/export/CloseExport" /* ExportActionTypes.CloseExport */,
});
exports.closeExport = closeExport;
const closeInProgressMessage = () => ({
    type: "compass-import-export/export/CloseInProgressMessage" /* ExportActionTypes.CloseInProgressMessage */,
});
exports.closeInProgressMessage = closeInProgressMessage;
const backToSelectFieldOptions = () => ({
    type: "compass-import-export/export/BackToSelectFieldOptions" /* ExportActionTypes.BackToSelectFieldOptions */,
});
exports.backToSelectFieldOptions = backToSelectFieldOptions;
const backToSelectFieldsToExport = () => ({
    type: "compass-import-export/export/BackToSelectFieldsToExport" /* ExportActionTypes.BackToSelectFieldsToExport */,
});
exports.backToSelectFieldsToExport = backToSelectFieldsToExport;
const toggleFieldToExport = (fieldId) => ({
    type: "compass-import-export/export/ToggleFieldToExport" /* ExportActionTypes.ToggleFieldToExport */,
    fieldId,
});
exports.toggleFieldToExport = toggleFieldToExport;
const toggleExportAllSelectedFields = () => ({
    type: "compass-import-export/export/ToggleExportAllSelectedFields" /* ExportActionTypes.ToggleExportAllSelectedFields */,
});
exports.toggleExportAllSelectedFields = toggleExportAllSelectedFields;
const addFieldToExport = (path) => ({
    type: "compass-import-export/export/AddFieldToExport" /* ExportActionTypes.AddFieldToExport */,
    path,
});
exports.addFieldToExport = addFieldToExport;
const readyToExport = () => ({
    type: "compass-import-export/export/ReadyToExport" /* ExportActionTypes.ReadyToExport */,
});
exports.readyToExport = readyToExport;
const cancelExport = () => ({
    type: "compass-import-export/export/CancelExport" /* ExportActionTypes.CancelExport */,
});
exports.cancelExport = cancelExport;
const selectFieldsToExport = () => {
    return async (dispatch, getState, { connections, logger: { log, mongoLogId } }) => {
        dispatch({
            type: "compass-import-export/export/SelectFieldsToExport" /* ExportActionTypes.SelectFieldsToExport */,
        });
        const fieldsToExportAbortController = new AbortController();
        dispatch({
            type: "compass-import-export/export/FetchFieldsToExport" /* ExportActionTypes.FetchFieldsToExport */,
            fieldsToExportAbortController,
        });
        const { export: { query, namespace, connectionId }, } = getState();
        let gatherFieldsResult;
        try {
            if (!connectionId) {
                throw new Error('ConnectionId not provided');
            }
            const dataService = connections.getDataServiceForConnection(connectionId);
            gatherFieldsResult = await (0, gather_fields_1.gatherFieldsFromQuery)({
                ns: namespace,
                abortSignal: fieldsToExportAbortController.signal,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                dataService: dataService,
                query,
                sampleSize: 50,
            });
        }
        catch (err) {
            log.error(mongoLogId(1_001_000_184), 'Export', 'Failed to gather fields for selecting for export', err);
            dispatch({
                type: "compass-import-export/export/FetchFieldsToExportError" /* ExportActionTypes.FetchFieldsToExportError */,
                errorMessage: err?.message,
            });
            return;
        }
        const fields = {};
        for (const schemaPath of gatherFieldsResult.paths) {
            fields[getIdForSchemaPath(schemaPath)] = {
                path: schemaPath,
                // We start all of the fields as unchecked.
                selected: false,
            };
        }
        dispatch({
            type: "compass-import-export/export/FetchFieldsToExportSuccess" /* ExportActionTypes.FetchFieldsToExportSuccess */,
            fieldsToExport: fields,
            aborted: fieldsToExportAbortController.signal.aborted ||
                gatherFieldsResult.aborted,
        });
    };
};
exports.selectFieldsToExport = selectFieldsToExport;
const runExport = ({ filePath, fileType, jsonFormatVariant, }) => {
    return async (dispatch, getState, { connections, preferences, track, logger: { log, mongoLogId } }) => {
        let outputWriteStream;
        try {
            outputWriteStream = fs_1.default.createWriteStream(filePath);
        }
        catch (err) {
            dispatch({
                type: "compass-import-export/export/ExportFileError" /* ExportActionTypes.ExportFileError */,
                errorMessage: err?.message || 'Error creating output file.',
            });
            return;
        }
        const startTime = Date.now();
        const { export: { connectionId, query: _query, namespace, fieldsToExport, aggregation, exportFullCollection, selectedFieldOption, fieldsAddedCount, }, } = getState();
        let fieldsIncludedCount = 0;
        let fieldsExcludedCount = 0;
        const query = exportFullCollection || aggregation
            ? {
                filter: {},
            }
            : selectedFieldOption === 'select-fields'
                ? {
                    ...(_query ?? {
                        filter: {},
                    }),
                    projection: (0, gather_fields_1.createProjectionFromSchemaFields)(Object.values(fieldsToExport)
                        .filter((field) => {
                        if (field.selected) {
                            fieldsIncludedCount++;
                        }
                        else {
                            fieldsExcludedCount++;
                        }
                        return field.selected;
                    })
                        .map((field) => field.path)),
                }
                : _query;
        log.info(mongoLogId(1_001_000_185), 'Export', 'Start export', {
            namespace,
            filePath,
            fileType,
            exportFullCollection,
            jsonFormatVariant,
            fieldsToExport,
            aggregation,
            query,
            selectedFieldOption,
        });
        const exportAbortController = new AbortController();
        dispatch({
            type: "compass-import-export/export/RunExport" /* ExportActionTypes.RunExport */,
            exportAbortController,
        });
        (0, export_toast_1.showStartingToast)({
            cancelExport: () => dispatch((0, exports.cancelExport)()),
            namespace,
        });
        let exportSucceeded = false;
        const progressCallback = lodash_1.default.throttle(function (index, csvPhase) {
            (0, export_toast_1.showInProgressToast)({
                cancelExport: () => dispatch((0, exports.cancelExport)()),
                docsWritten: index,
                filePath,
                namespace,
                csvPhase,
            });
        }, 1000);
        let exportResult;
        try {
            if (!connectionId) {
                throw new Error('ConnectionId not provided');
            }
            const dataService = connections.getDataServiceForConnection(connectionId);
            const baseExportOptions = {
                ns: namespace,
                abortSignal: exportAbortController.signal,
                dataService,
                preferences,
                progressCallback,
                output: outputWriteStream,
            };
            if (aggregation) {
                if (fileType === 'csv') {
                    exportResult = await (0, export_csv_1.exportCSVFromAggregation)({
                        ...baseExportOptions,
                        aggregation,
                    });
                }
                else {
                    exportResult = await (0, export_json_1.exportJSONFromAggregation)({
                        ...baseExportOptions,
                        aggregation,
                        variant: jsonFormatVariant,
                    });
                }
            }
            else {
                if (fileType === 'csv') {
                    exportResult = await (0, export_csv_1.exportCSVFromQuery)({
                        ...baseExportOptions,
                        query,
                    });
                }
                else {
                    exportResult = await (0, export_json_1.exportJSONFromQuery)({
                        ...baseExportOptions,
                        query,
                        variant: jsonFormatVariant,
                    });
                }
            }
            log.info(mongoLogId(1_001_000_186), 'Export', 'Finished export', {
                namespace,
                docsWritten: exportResult.docsWritten,
                filePath,
            });
            exportSucceeded = true;
            progressCallback.flush();
        }
        catch (err) {
            log.error(mongoLogId(1_001_000_187), 'Export', 'Export failed', {
                namespace,
                error: err?.message,
            });
            dispatch({
                type: "compass-import-export/export/RunExportError" /* ExportActionTypes.RunExportError */,
                error: err,
            });
            (0, export_toast_1.showFailedToast)(err);
        }
        finally {
            outputWriteStream.close();
        }
        const aborted = !!(exportAbortController.signal.aborted || exportResult?.aborted);
        track('Export Completed', {
            type: aggregation ? 'aggregation' : 'query',
            all_docs: exportFullCollection,
            has_projection: exportFullCollection || aggregation || !_query
                ? undefined
                : (0, query_has_projection_1.queryHasProjection)(_query),
            field_option: exportFullCollection ||
                aggregation ||
                (_query && (0, query_has_projection_1.queryHasProjection)(_query))
                ? undefined
                : selectedFieldOption,
            file_type: fileType,
            json_format: fileType === 'json' ? jsonFormatVariant : undefined,
            field_count: selectedFieldOption === 'select-fields'
                ? fieldsIncludedCount
                : undefined,
            fields_added_count: selectedFieldOption === 'select-fields'
                ? fieldsAddedCount
                : undefined,
            fields_not_selected_count: selectedFieldOption === 'select-fields'
                ? fieldsExcludedCount
                : undefined,
            number_of_docs: exportResult?.docsWritten,
            success: exportSucceeded,
            stopped: aborted,
            duration: Date.now() - startTime,
        }, connections.getConnectionById(connectionId)?.info);
        if (!exportSucceeded) {
            return;
        }
        if (exportResult?.aborted) {
            (0, export_toast_1.showCancelledToast)({
                docsWritten: exportResult?.docsWritten ?? 0,
                filePath,
            });
        }
        else {
            (0, export_toast_1.showCompletedToast)({
                docsWritten: exportResult?.docsWritten ?? 0,
                filePath,
            });
        }
        dispatch({
            type: "compass-import-export/export/RunExportSuccess" /* ExportActionTypes.RunExportSuccess */,
            aborted,
        });
    };
};
exports.runExport = runExport;
const exportReducer = (state = exports.initialState, action) => {
    if (isAction(action, "compass-import-export/export/OpenExport" /* ExportActionTypes.OpenExport */)) {
        // When an export is already in progress show the in progress modal.
        if (state.status === 'in-progress') {
            return {
                ...state,
                isInProgressMessageOpen: true,
            };
        }
        return {
            ...exports.initialState,
            connectionId: action.connectionId,
            status: !!action.aggregation ||
                !!action.exportFullCollection ||
                !action.query ||
                !!(0, query_has_projection_1.queryHasProjection)(action.query)
                ? 'ready-to-export'
                : 'select-field-options',
            isInProgressMessageOpen: false,
            isOpen: true,
            fieldsAddedCount: 0,
            fieldsToExport: {},
            errorLoadingFieldsToExport: undefined,
            selectedFieldOption: 'all-fields',
            exportFileError: undefined,
            namespace: action.namespace,
            exportFullCollection: action.exportFullCollection,
            query: action.query,
            aggregation: action.aggregation,
        };
    }
    if (isAction(action, "compass-import-export/export/CloseExport" /* ExportActionTypes.CloseExport */)) {
        // Cancel any ongoing operations.
        state.fieldsToExportAbortController?.abort();
        state.exportAbortController?.abort();
        return {
            ...state,
            isOpen: false,
        };
    }
    if (isAction(action, "compass-import-export/export/CloseInProgressMessage" /* ExportActionTypes.CloseInProgressMessage */)) {
        return {
            ...state,
            isInProgressMessageOpen: false,
        };
    }
    if (isAction(action, "compass-import-export/export/SelectFieldsToExport" /* ExportActionTypes.SelectFieldsToExport */)) {
        return {
            ...state,
            errorLoadingFieldsToExport: undefined,
            selectedFieldOption: 'select-fields',
            status: 'select-fields-to-export',
        };
    }
    if (isAction(action, "compass-import-export/export/FetchFieldsToExport" /* ExportActionTypes.FetchFieldsToExport */)) {
        state.fieldsToExportAbortController?.abort();
        return {
            ...state,
            fieldsToExportAbortController: action.fieldsToExportAbortController,
        };
    }
    if (isAction(action, "compass-import-export/export/FetchFieldsToExportError" /* ExportActionTypes.FetchFieldsToExportError */)) {
        return {
            ...state,
            errorLoadingFieldsToExport: action.errorMessage,
            fieldsToExportAbortController: undefined,
        };
    }
    if (isAction(action, "compass-import-export/export/FetchFieldsToExportSuccess" /* ExportActionTypes.FetchFieldsToExportSuccess */)) {
        if (action.aborted) {
            // Ignore when the selecting fields was cancelled.
            // Currently we don't let the user intentionally skip fetching fields, so an abort
            // would come from closing the modal or performing a different way of exporting.
            return state;
        }
        return {
            ...state,
            fieldsToExport: action.fieldsToExport,
            fieldsToExportAbortController: undefined,
        };
    }
    if (isAction(action, "compass-import-export/export/BackToSelectFieldOptions" /* ExportActionTypes.BackToSelectFieldOptions */)) {
        state.fieldsToExportAbortController?.abort();
        return {
            ...state,
            fieldsToExportAbortController: undefined,
            status: 'select-field-options',
        };
    }
    if (isAction(action, "compass-import-export/export/BackToSelectFieldsToExport" /* ExportActionTypes.BackToSelectFieldsToExport */)) {
        return {
            ...state,
            status: 'select-fields-to-export',
        };
    }
    if (isAction(action, "compass-import-export/export/ToggleFieldToExport" /* ExportActionTypes.ToggleFieldToExport */)) {
        return {
            ...state,
            fieldsToExport: {
                ...state.fieldsToExport,
                [action.fieldId]: {
                    ...state.fieldsToExport[action.fieldId],
                    selected: !state.fieldsToExport[action.fieldId].selected,
                },
            },
        };
    }
    if (isAction(action, "compass-import-export/export/AddFieldToExport" /* ExportActionTypes.AddFieldToExport */)) {
        return {
            ...state,
            fieldsAddedCount: state.fieldsAddedCount,
            fieldsToExport: {
                ...state.fieldsToExport,
                [getIdForSchemaPath(action.path)]: {
                    path: action.path,
                    selected: true,
                },
            },
        };
    }
    if (isAction(action, "compass-import-export/export/ToggleExportAllSelectedFields" /* ExportActionTypes.ToggleExportAllSelectedFields */)) {
        const newFieldsToExport = {};
        const areAllSelected = Object.values(state.fieldsToExport).every((field) => field.selected);
        Object.entries(state.fieldsToExport).map(([fieldId, field]) => {
            newFieldsToExport[fieldId] = {
                ...field,
                selected: !areAllSelected,
            };
        });
        return {
            ...state,
            fieldsToExport: newFieldsToExport,
        };
    }
    if (isAction(action, "compass-import-export/export/ReadyToExport" /* ExportActionTypes.ReadyToExport */)) {
        return {
            ...state,
            status: 'ready-to-export',
            selectedFieldOption: action.selectedFieldOption === 'all-fields'
                ? action.selectedFieldOption
                : state.selectedFieldOption,
        };
    }
    if (isAction(action, "compass-import-export/export/RunExport" /* ExportActionTypes.RunExport */)) {
        state.fieldsToExportAbortController?.abort();
        state.exportAbortController?.abort();
        return {
            ...state,
            isOpen: false,
            status: 'in-progress',
            exportAbortController: action.exportAbortController,
        };
    }
    if (isAction(action, "compass-import-export/export/ExportFileError" /* ExportActionTypes.ExportFileError */)) {
        return {
            ...state,
            exportFileError: action.errorMessage,
        };
    }
    if (isAction(action, "compass-import-export/export/CancelExport" /* ExportActionTypes.CancelExport */)) {
        state.exportAbortController?.abort();
        return {
            ...state,
            exportAbortController: undefined,
        };
    }
    if (isAction(action, "compass-import-export/export/RunExportError" /* ExportActionTypes.RunExportError */)) {
        return {
            ...state,
            status: undefined,
            exportAbortController: undefined,
        };
    }
    if (isAction(action, "compass-import-export/export/RunExportSuccess" /* ExportActionTypes.RunExportSuccess */)) {
        return {
            ...state,
            status: undefined,
            exportAbortController: undefined,
        };
    }
    return state;
};
exports.exportReducer = exportReducer;
//# sourceMappingURL=export.js.map