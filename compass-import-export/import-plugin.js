"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const import_modal_1 = __importDefault(require("./components/import-modal"));
const import_in_progress_modal_1 = __importDefault(require("./components/import-in-progress-modal"));
function ImportPlugin() {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(import_modal_1.default, null),
        react_1.default.createElement(import_in_progress_modal_1.default, null)));
}
exports.default = ImportPlugin;
//# sourceMappingURL=import-plugin.js.map