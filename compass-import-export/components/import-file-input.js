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
exports.ImportFileInput = ImportFileInput;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
function ImportFileInput({ autoOpen, onCancel, selectImportFileName, fileName, }) {
    const handleChooseFile = (0, react_1.useCallback)((files) => {
        if (files.length > 0) {
            void selectImportFileName(files[0]);
        }
        else if (typeof onCancel === 'function') {
            onCancel();
        }
    }, [onCancel, selectImportFileName]);
    const values = fileName ? [fileName] : undefined;
    return (react_1.default.createElement(compass_components_1.FilePickerDialog, { autoOpen: autoOpen, label: "Import file:", id: "import-file", onChange: handleChooseFile, values: values, variant: "small", mode: "open", title: "Select JSON or CSV to import", buttonLabel: "Select" }));
}
//# sourceMappingURL=import-file-input.js.map