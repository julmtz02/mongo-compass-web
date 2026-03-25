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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const process_status_1 = require("../constants/process-status");
const import_preview_1 = require("./import-preview");
const import_preview_loader_1 = __importDefault(require("./import-preview-loader"));
const import_options_1 = require("./import-options");
const import_1 = require("../modules/import");
const import_file_input_1 = require("./import-file-input");
const provider_1 = require("@mongodb-js/compass-telemetry/provider");
const closeButtonStyles = (0, compass_components_1.css)({
    marginRight: compass_components_1.spacing[200],
});
const fieldsHeadingStyles = (0, compass_components_1.css)({
    fontWeight: 'bold',
    paddingBottom: compass_components_1.spacing[200],
});
const fieldsHeadingStylesDark = (0, compass_components_1.css)({
    borderBottom: `2px solid ${compass_components_1.palette.gray.dark2}`,
});
const fieldsHeadingStylesLight = (0, compass_components_1.css)({
    borderBottom: `2px solid ${compass_components_1.palette.gray.light2}`,
});
const analyzeContainerStyles = (0, compass_components_1.css)({
    // Remove double spacing between the analyze container and the form action
    // buttons caused by analyze always being the last item when visible.
    marginBottom: 0,
});
const dataTypesLinkStyles = (0, compass_components_1.css)({
    marginLeft: compass_components_1.spacing[400],
});
function ImportModal({ isOpen, ns, startImport, cancelImport, closeImport, errors, status, selectImportFileName, setDelimiter, delimiter, fileType, fileName, stopOnErrors, setStopOnErrors, ignoreBlanks, setIgnoreBlanks, fields, values, toggleIncludeField, setFieldType, previewLoaded, csvAnalyzed, analyzeError, }) {
    const darkMode = (0, compass_components_1.useDarkMode)();
    const modalBodyRef = (0, react_1.useRef)(null);
    const handleClose = (0, react_1.useCallback)(() => {
        cancelImport();
        closeImport();
    }, [closeImport, cancelImport]);
    (0, react_1.useEffect)(() => {
        // When the errors change and there are new errors, we auto scroll
        // to the end of the modal body to ensure folks see the new errors.
        if (isOpen && errors && modalBodyRef.current) {
            const contentDiv = modalBodyRef.current;
            contentDiv.scrollTop = contentDiv.scrollHeight;
        }
    }, [errors, isOpen]);
    (0, provider_1.useTrackOnChange)((track) => {
        if (isOpen) {
            track('Screen', { name: 'import_modal' }, undefined);
        }
    }, [isOpen], undefined);
    if (isOpen && !fileName && errors.length === 0) {
        // Show the file input when we don't have a file to import yet.
        return (
        // Don't actually show it on the screen, just render it to trigger
        // autoOpen
        react_1.default.createElement("div", { style: { display: 'none' } },
            react_1.default.createElement(import_file_input_1.ImportFileInput, { autoOpen: true, onCancel: handleClose, fileName: fileName, selectImportFileName: selectImportFileName })));
    }
    return (react_1.default.createElement(compass_components_1.Modal, { open: isOpen, setOpen: handleClose, "data-testid": "import-modal", size: fileType === 'csv' ? 'large' : 'small' },
        react_1.default.createElement(compass_components_1.ModalHeader, { title: "Import", subtitle: `To collection ${ns}` }),
        react_1.default.createElement(compass_components_1.ModalBody, { ref: modalBodyRef },
            react_1.default.createElement(import_options_1.ImportOptions, { delimiter: delimiter, setDelimiter: setDelimiter, fileType: fileType, fileName: fileName, selectImportFileName: selectImportFileName, stopOnErrors: stopOnErrors, setStopOnErrors: setStopOnErrors, ignoreBlanks: ignoreBlanks, setIgnoreBlanks: setIgnoreBlanks }),
            fileType === 'csv' && !analyzeError && (react_1.default.createElement(compass_components_1.FormFieldContainer, { className: analyzeContainerStyles },
                react_1.default.createElement(compass_components_1.Body, { as: "h3", className: (0, compass_components_1.cx)(fieldsHeadingStyles, darkMode ? fieldsHeadingStylesDark : fieldsHeadingStylesLight) },
                    "Specify Fields and Types",
                    react_1.default.createElement(compass_components_1.Link, { className: dataTypesLinkStyles, href: "https://www.mongodb.com/docs/mongodb-shell/reference/data-types/" }, "Learn more about data types")),
                csvAnalyzed ? (react_1.default.createElement(import_preview_1.ImportPreview, { loaded: previewLoaded, onFieldCheckedChanged: toggleIncludeField, setFieldType: setFieldType, values: values, fields: fields })) : (react_1.default.createElement(import_preview_loader_1.default, null)))),
            errors.length > 0 && (react_1.default.createElement(compass_components_1.ErrorSummary, { errors: errors.map((error) => error.message) })),
            analyzeError && (react_1.default.createElement(compass_components_1.ErrorSummary, { "data-testid": "analyze-error", errors: [analyzeError.message] }))),
        react_1.default.createElement(compass_components_1.ModalFooter, null,
            react_1.default.createElement(compass_components_1.Button, { "data-testid": "import-button", onClick: startImport, disabled: !fileName ||
                    status === process_status_1.STARTED ||
                    (fileType === 'csv' && !csvAnalyzed), variant: "primary" }, status === process_status_1.STARTED ? 'Importing\u2026' : 'Import'),
            react_1.default.createElement(compass_components_1.Button, { className: closeButtonStyles, "data-testid": "cancel-button", onClick: handleClose }, process_status_1.FINISHED_STATUSES.includes(status) ? 'Close' : 'Cancel'))));
}
/**
 * Map the state of the store to component properties.
 */
const mapStateToProps = (state) => ({
    ns: state.import.namespace,
    isOpen: state.import.isOpen,
    errors: state.import.firstErrors,
    fileType: state.import.fileType,
    fileName: state.import.fileName,
    status: state.import.status,
    delimiter: state.import.delimiter,
    stopOnErrors: state.import.stopOnErrors,
    ignoreBlanks: state.import.ignoreBlanks,
    fields: state.import.fields,
    values: state.import.values,
    previewLoaded: state.import.previewLoaded,
    csvAnalyzed: state.import.analyzeStatus === 'COMPLETED',
    analyzeError: state.import.analyzeError,
});
/**
 * Export the connected component as the default.
 */
exports.default = (0, react_redux_1.connect)(mapStateToProps, {
    startImport: import_1.startImport,
    cancelImport: import_1.cancelImport,
    skipCSVAnalyze: import_1.skipCSVAnalyze,
    selectImportFileName: import_1.selectImportFileName,
    setDelimiter: import_1.setDelimiter,
    setStopOnErrors: import_1.setStopOnErrors,
    setIgnoreBlanks: import_1.setIgnoreBlanks,
    closeImport: import_1.closeImport,
    toggleIncludeField: import_1.toggleIncludeField,
    setFieldType: import_1.setFieldType,
})(ImportModal);
//# sourceMappingURL=import-modal.js.map