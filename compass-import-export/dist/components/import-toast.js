"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showFailedToast = exports.showCancelledToast = exports.showCompletedWithErrorsToast = exports.showUnboundArraySignalToast = exports.showBloatedDocumentSignalToast = exports.showCompletedToast = exports.showStartingToast = exports.showInProgressToast = void 0;
const react_1 = __importDefault(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const path_1 = __importDefault(require("path"));
const importToastId = 'import-toast';
const bloatedDocumentSignalToastId = 'import-toast-bloated-document';
const toastMessageCharacterLimit = 180;
function showInProgressToast({ fileName, cancelImport, docsWritten, numErrors, bytesProcessed, bytesTotal, }) {
    // Update the toast with the new progress.
    const progress = bytesTotal ? bytesProcessed / bytesTotal : undefined;
    let statusMessage = `${docsWritten} document${docsWritten !== 1 ? 's' : ''} written.`;
    if (numErrors) {
        statusMessage += ` ${numErrors} error${numErrors !== 1 ? 's' : ''}.`;
    }
    (0, compass_components_1.openToast)(importToastId, {
        title: `Importing ${path_1.default.basename(fileName)}…`,
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: statusMessage, actionHandler: cancelImport, actionText: "stop" })),
        progress,
        variant: 'progress',
        dismissible: false,
    });
}
exports.showInProgressToast = showInProgressToast;
function showStartingToast({ fileName, cancelImport, }) {
    (0, compass_components_1.openToast)(importToastId, {
        title: `Importing ${path_1.default.basename(fileName)}…`,
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: "Starting\u2026", actionHandler: cancelImport, actionText: "stop" })),
        variant: 'progress',
        dismissible: false,
    });
}
exports.showStartingToast = showStartingToast;
function showCompletedToast({ docsWritten }) {
    (0, compass_components_1.openToast)(importToastId, {
        title: 'Import completed.',
        description: `${docsWritten} document${docsWritten === 1 ? '' : 's'} imported.`,
        variant: 'success',
    });
}
exports.showCompletedToast = showCompletedToast;
const reviewDocumentsCTAStyles = (0, compass_components_1.css)({
    cursor: 'pointer',
    textDecoration: 'underline',
});
function showBloatedDocumentSignalToast({ onReviewDocumentsClick, }) {
    (0, compass_components_1.openToast)(bloatedDocumentSignalToastId, {
        title: 'Possibly bloated documents',
        description: (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(compass_components_1.Body, { as: "span" }, "The imported documents might exceed a reasonable size for performance."),
            onReviewDocumentsClick && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("br", null),
                react_1.default.createElement(compass_components_1.Body, { as: "strong", onClick: onReviewDocumentsClick, className: reviewDocumentsCTAStyles }, "Review Documents"))))),
        variant: 'note',
    });
}
exports.showBloatedDocumentSignalToast = showBloatedDocumentSignalToast;
function showUnboundArraySignalToast({ onReviewDocumentsClick, }) {
    (0, compass_components_1.openToast)(bloatedDocumentSignalToastId, {
        title: 'Large array detected',
        description: (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(compass_components_1.Body, { as: "span" }, "Some of the imported documents contained unbounded arrays that may degrade efficiency"),
            onReviewDocumentsClick && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("br", null),
                react_1.default.createElement(compass_components_1.Body, { as: "strong", onClick: onReviewDocumentsClick, className: reviewDocumentsCTAStyles }, "Review Documents"))))),
        variant: 'note',
    });
}
exports.showUnboundArraySignalToast = showUnboundArraySignalToast;
function getToastErrorsText(errors) {
    const rawErrorsText = errors
        .slice(0, 2)
        .map((error) => error.message)
        .join('\n');
    // Show the first two errors and a message that more errors exists.
    const errorsText = `${rawErrorsText.length > toastMessageCharacterLimit
        ? `${rawErrorsText.substring(0, toastMessageCharacterLimit)}…`
        : rawErrorsText}${errors.length > 2
        ? '\nMore errors occurred, open the error log to view.\n'
        : ''}`;
    return errorsText;
}
function showCompletedWithErrorsToast({ errors, docsWritten, docsProcessed, actionHandler, }) {
    const statusMessage = getToastErrorsText(errors);
    (0, compass_components_1.openToast)(importToastId, {
        title: `Import completed ${docsWritten}/${docsProcessed} with errors:`,
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: statusMessage, actionHandler: actionHandler, actionText: "view log" })),
        variant: 'warning',
    });
}
exports.showCompletedWithErrorsToast = showCompletedWithErrorsToast;
function showCancelledToast({ errors, actionHandler, }) {
    if (errors.length > 0) {
        const statusMessage = getToastErrorsText(errors);
        (0, compass_components_1.openToast)(importToastId, {
            title: 'Import aborted with the following errors:',
            description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: statusMessage, actionHandler: actionHandler, actionText: "view log" })),
            variant: 'warning',
        });
        return;
    }
    (0, compass_components_1.openToast)(importToastId, {
        title: 'Import aborted.',
        description: null,
        variant: 'warning',
    });
}
exports.showCancelledToast = showCancelledToast;
function showFailedToast(err, showErrorDetails) {
    (0, compass_components_1.openToast)(importToastId, {
        title: 'Failed to import with the following error:',
        description: (react_1.default.createElement(react_1.default.Fragment, null,
            err?.message,
            "\u00A0",
            showErrorDetails && (react_1.default.createElement(compass_components_1.Link, { onClick: () => {
                    showErrorDetails();
                    (0, compass_components_1.closeToast)(importToastId);
                }, "data-testid": "import-error-details-button" }, "View error details")))),
        variant: 'warning',
    });
}
exports.showFailedToast = showFailedToast;
//# sourceMappingURL=import-toast.js.map