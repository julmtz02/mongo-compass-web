"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showInProgressToast = showInProgressToast;
exports.showStartingToast = showStartingToast;
exports.showCompletedToast = showCompletedToast;
exports.showCancelledToast = showCancelledToast;
exports.showFailedToast = showFailedToast;
const react_1 = __importDefault(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const path_1 = __importDefault(require("path"));
const reveal_file_1 = __importDefault(require("../utils/reveal-file"));
const exportToastId = 'export-toast';
const docsWrittenText = (docsWritten) => {
    return `${docsWritten} document${docsWritten !== 1 ? 's' : ''} written.`;
};
function showInProgressToast({ filePath, namespace, cancelExport, docsWritten, csvPhase, }) {
    let statusMessage = docsWrittenText(docsWritten);
    if (csvPhase === 'DOWNLOAD') {
        statusMessage = `Processing documents before exporting, ${docsWritten} document${docsWritten !== 1 ? 's' : ''} processed.`;
    }
    // Update the toast with the new progress.
    (0, compass_components_1.openToast)(exportToastId, {
        title: `Exporting "${namespace}" to ${path_1.default.basename(filePath)}…`,
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: statusMessage, actionHandler: cancelExport, actionText: "stop" })),
        progress: undefined, // Don't show progress as there is no total document count.
        variant: 'progress',
        dismissible: false,
    });
}
function showStartingToast({ namespace, cancelExport, }) {
    (0, compass_components_1.openToast)(exportToastId, {
        title: `Exporting "${namespace}"…`,
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: "Starting\u2026", actionHandler: cancelExport, actionText: "stop" })),
        variant: 'progress',
        dismissible: false,
    });
}
function showCompletedToast({ docsWritten, filePath, }) {
    (0, compass_components_1.openToast)(exportToastId, {
        title: 'Export completed.',
        description: (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: docsWrittenText(docsWritten), actionHandler: () => (0, reveal_file_1.default)(filePath), actionText: "show file" })),
        variant: 'success',
    });
}
function showCancelledToast({ docsWritten, filePath, }) {
    (0, compass_components_1.openToast)(exportToastId, {
        title: 'Export aborted.',
        description: docsWritten > 0 ? (react_1.default.createElement(compass_components_1.ToastBody, { statusMessage: docsWrittenText(docsWritten), actionHandler: () => (0, reveal_file_1.default)(filePath), actionText: "show file" })) : null,
        variant: 'warning',
    });
}
function showFailedToast(err) {
    (0, compass_components_1.openToast)(exportToastId, {
        title: 'Failed to export with the following error:',
        description: err?.message,
        variant: 'warning',
    });
}
//# sourceMappingURL=export-toast.js.map