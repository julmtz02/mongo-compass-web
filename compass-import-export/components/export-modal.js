"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportModal = void 0;
exports.UnconnectedExportModal = ExportModal;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const export_1 = require("../modules/export");
const select_file_type_1 = require("./select-file-type");
const export_select_fields_1 = require("./export-select-fields");
const export_code_view_1 = require("./export-code-view");
const query_has_projection_1 = require("../utils/query-has-projection");
const export_field_options_1 = require("./export-field-options");
const export_json_format_options_1 = require("./export-json-format-options");
const provider_1 = require("@mongodb-js/compass-telemetry/provider");
function useExport() {
    const [fileType, setFileType] = (0, react_1.useState)('json');
    const [fieldsToExportOption, setFieldsToExportOption] = (0, react_1.useState)('all-fields');
    const [jsonFormatVariant, setJSONFormatVariant] = (0, react_1.useState)('default');
    const resetExportFormState = (0, react_1.useCallback)(() => {
        setFileType('json');
        setFieldsToExportOption('all-fields');
        setJSONFormatVariant('default');
    }, []);
    return [
        {
            fileType,
            fieldsToExportOption,
            jsonFormatVariant,
        },
        {
            setFileType,
            setFieldsToExportOption,
            setJSONFormatVariant,
            resetExportFormState,
        },
    ];
}
const closeButtonStyles = (0, compass_components_1.css)({
    marginRight: compass_components_1.spacing[200],
});
const messageBannerStyles = (0, compass_components_1.css)({
    marginTop: compass_components_1.spacing[400],
});
const modalBodyStyles = (0, compass_components_1.css)({
    paddingTop: compass_components_1.spacing[400],
});
function ExportModal({ ns, query, aggregation, exportFileError, exportFullCollection, isFieldsToExportLoading, selectedFieldOption, selectFieldsToExport, readyToExport, runExport, isOpen, closeExport, status, backToSelectFieldOptions, backToSelectFieldsToExport, }) {
    // TODO: this state depends on redux store too much and should be part of
    // redux store and not UI
    const [{ fileType, jsonFormatVariant, fieldsToExportOption }, { setFileType, setJSONFormatVariant, setFieldsToExportOption, resetExportFormState, },] = useExport();
    (0, provider_1.useTrackOnChange)((track) => {
        if (isOpen) {
            track('Screen', { name: 'export_modal' }, undefined);
        }
    }, [isOpen], undefined);
    const onClickBack = (0, react_1.useCallback)(() => {
        if (status === 'ready-to-export' && selectedFieldOption !== 'all-fields') {
            backToSelectFieldsToExport();
            return;
        }
        backToSelectFieldOptions();
    }, [
        status,
        backToSelectFieldOptions,
        selectedFieldOption,
        backToSelectFieldsToExport,
    ]);
    const onClickSelectFieldOptionsNext = (0, react_1.useCallback)(() => {
        if (fieldsToExportOption === 'all-fields') {
            readyToExport('all-fields');
            return;
        }
        selectFieldsToExport();
    }, [readyToExport, selectFieldsToExport, fieldsToExportOption]);
    const onSelectExportFilePath = (0, react_1.useCallback)((filePath) => {
        runExport({
            filePath,
            fileType,
            jsonFormatVariant,
        });
    }, [runExport, fileType, jsonFormatVariant]);
    const onClickExport = (0, react_1.useCallback)(() => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-require-imports
        const electron = require('@electron/remote');
        const fileBackend = (0, compass_components_1.createElectronFileInputBackend)(electron, null)();
        fileBackend.onFilesChosen((files) => {
            if (files.length > 0) {
                onSelectExportFilePath(files[0]);
            }
        });
        fileBackend.openFileChooser({
            multi: false,
            mode: 'save',
            title: 'Target output file',
            defaultPath: `${ns}.${fileType}`,
            buttonLabel: 'Select',
            filters: [
                { name: fileType, extensions: [fileType] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
    }, [fileType, ns, onSelectExportFilePath]);
    const onSelectExportFileNameEvent = (0, react_1.useCallback)(({ detail: filePath }) => {
        onSelectExportFilePath(filePath);
    }, [onSelectExportFilePath]);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            // For e2e testing we can't set the value of a file output
            // for security reasons, so we listen to a dom event that sets it.
            // https://github.com/electron-userland/spectron/issues/23
            document.addEventListener('selectExportFileName', onSelectExportFileNameEvent);
            return () => {
                document.removeEventListener('selectExportFileName', onSelectExportFileNameEvent);
            };
        }
    }, [isOpen, onSelectExportFileNameEvent]);
    (0, react_1.useLayoutEffect)(() => {
        if (isOpen) {
            resetExportFormState();
        }
    }, [isOpen, resetExportFormState]);
    return (react_1.default.createElement(compass_components_1.Modal, { open: isOpen, setOpen: closeExport, "data-testid": "export-modal", initialFocus: exportFullCollection ? undefined : `#${export_code_view_1.codeElementId}` },
        react_1.default.createElement(compass_components_1.ModalHeader, { title: "Export", subtitle: aggregation ? `Aggregation on ${ns}` : `Collection ${ns}` }),
        react_1.default.createElement(compass_components_1.ModalBody, { className: modalBodyStyles },
            status === 'select-field-options' && (react_1.default.createElement(react_1.default.Fragment, null,
                !exportFullCollection && !aggregation && react_1.default.createElement(export_code_view_1.ExportCodeView, null),
                react_1.default.createElement(export_field_options_1.FieldsToExportOptions, { fieldsToExportOption: fieldsToExportOption, setFieldsToExportOption: setFieldsToExportOption }))),
            status === 'select-fields-to-export' && react_1.default.createElement(export_select_fields_1.ExportSelectFields, null),
            status === 'ready-to-export' && (react_1.default.createElement(react_1.default.Fragment, null,
                !exportFullCollection && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(export_code_view_1.ExportCodeView, null),
                    !aggregation && query && (0, query_has_projection_1.queryHasProjection)(query) && (react_1.default.createElement(compass_components_1.Banner, { "data-testid": "export-projection-banner" },
                        "Only projected fields will be exported. To export all fields, go back and leave the ",
                        react_1.default.createElement("b", null, "Project"),
                        " field empty.")))),
                react_1.default.createElement(select_file_type_1.SelectFileType, { fileType: fileType, label: "Export File Type", onSelected: setFileType }),
                fileType === 'csv' && (react_1.default.createElement(compass_components_1.Banner, { className: messageBannerStyles },
                    "Exporting with CSV may lose type information and is not suitable for backing up your data.",
                    ' ',
                    react_1.default.createElement(compass_components_1.Link, { href: "https://www.mongodb.com/docs/compass/current/import-export/#export-data-from-a-collection", target: "_blank" }, "Learn more"))),
                fileType === 'json' && (react_1.default.createElement(export_json_format_options_1.JSONFileTypeOptions, { jsonFormat: jsonFormatVariant, setJSONFormatVariant: setJSONFormatVariant })),
                exportFileError && (react_1.default.createElement(compass_components_1.Banner, { variant: "danger", className: messageBannerStyles },
                    "Error creating output file: ",
                    exportFileError))))),
        react_1.default.createElement(compass_components_1.ModalFooter, null,
            status === 'select-field-options' && (react_1.default.createElement(compass_components_1.Button, { "data-testid": "export-next-step-button", onClick: onClickSelectFieldOptionsNext, variant: "primary" }, "Next")),
            status === 'select-fields-to-export' && (react_1.default.createElement(compass_components_1.Button, { "data-testid": "export-next-step-button", onClick: () => readyToExport(), disabled: isFieldsToExportLoading, variant: "primary" }, "Next")),
            status === 'ready-to-export' && (react_1.default.createElement(compass_components_1.Button, { "data-testid": "export-button", onClick: onClickExport, variant: "primary" }, "Export\u2026")),
            ((status === 'ready-to-export' &&
                !exportFullCollection &&
                !aggregation &&
                !(query && (0, query_has_projection_1.queryHasProjection)(query))) ||
                status === 'select-fields-to-export') && (react_1.default.createElement(compass_components_1.Button, { className: closeButtonStyles, onClick: onClickBack }, "Back")),
            ((status === 'ready-to-export' &&
                (aggregation ||
                    exportFullCollection ||
                    (query && (0, query_has_projection_1.queryHasProjection)(query)))) ||
                status === 'select-field-options') && (react_1.default.createElement(compass_components_1.Button, { "data-testid": "export-close-export-button", className: closeButtonStyles, onClick: closeExport }, "Cancel")))));
}
const ConnectedExportModal = (0, react_redux_1.connect)((state) => ({
    isOpen: state.export.isOpen,
    ns: state.export.namespace,
    query: state.export.query,
    aggregation: state.export.aggregation,
    exportFullCollection: state.export.exportFullCollection,
    isFieldsToExportLoading: !!state.export.fieldsToExportAbortController,
    status: state.export.status,
    selectedFieldOption: state.export.selectedFieldOption,
    exportFileError: state.export.exportFileError,
}), {
    closeExport: export_1.closeExport,
    selectFieldsToExport: export_1.selectFieldsToExport,
    backToSelectFieldOptions: export_1.backToSelectFieldOptions,
    backToSelectFieldsToExport: export_1.backToSelectFieldsToExport,
    readyToExport: export_1.readyToExport,
    runExport: export_1.runExport,
})(ExportModal);
exports.ExportModal = ConnectedExportModal;
//# sourceMappingURL=export-modal.js.map