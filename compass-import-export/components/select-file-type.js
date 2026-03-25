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
exports.SelectFileType = SelectFileType;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const selectFileTypeLabelId = 'select-file-type-label';
const radioBoxGroupId = 'radio-box-group-id';
const containerStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[400]}px 0`,
});
function SelectFileType({ fileType, onSelected, label, }) {
    const onFileTypeChanged = (0, react_1.useCallback)(({ target: { value } }) => {
        onSelected(value);
    }, [onSelected]);
    return (react_1.default.createElement("div", { className: containerStyles },
        react_1.default.createElement(compass_components_1.Label, { htmlFor: radioBoxGroupId, id: selectFileTypeLabelId }, label),
        react_1.default.createElement(compass_components_1.RadioBoxGroup, { "aria-labelledby": selectFileTypeLabelId, "data-testid": "select-file-type", id: radioBoxGroupId, onChange: onFileTypeChanged, value: fileType },
            react_1.default.createElement(compass_components_1.RadioBox, { "data-testid": "select-file-type-json", value: "json" }, "JSON"),
            react_1.default.createElement(compass_components_1.RadioBox, { "data-testid": "select-file-type-csv", value: "csv" }, "CSV"))));
}
//# sourceMappingURL=select-file-type.js.map