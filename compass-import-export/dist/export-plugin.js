"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const export_modal_1 = require("./components/export-modal");
const export_in_progress_modal_1 = __importDefault(require("./components/export-in-progress-modal"));
function ExportPlugin() {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(export_modal_1.ExportModal, null),
        react_1.default.createElement(export_in_progress_modal_1.default, null)));
}
exports.default = ExportPlugin;
//# sourceMappingURL=export-plugin.js.map