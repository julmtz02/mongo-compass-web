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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldsToExportOptions = void 0;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const selectFieldsRadioBoxStyles = (0, compass_components_1.css)({
    // Keep the label from going to two lines.
    whiteSpace: 'nowrap',
});
const messageBannerStyles = (0, compass_components_1.css)({
    marginTop: compass_components_1.spacing[400],
});
const selectFieldsToExportId = 'select-fields-to-export';
const selectFieldsToExportLabelId = 'select-fields-to-export-label';
function FieldsToExportOptions({ fieldsToExportOption, setFieldsToExportOption, }) {
    const [showProjectInfoMessage, setShowProjectInfoMessage] = (0, react_1.useState)(true);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(compass_components_1.Label, { htmlFor: selectFieldsToExportId, id: selectFieldsToExportLabelId }, "Fields to export"),
        react_1.default.createElement(compass_components_1.RadioBoxGroup, { "aria-labelledby": selectFieldsToExportLabelId, "data-testid": "select-file-type", id: selectFieldsToExportId, onChange: ({ target: { value }, }) => setFieldsToExportOption(value), value: fieldsToExportOption },
            react_1.default.createElement(compass_components_1.RadioBox, { id: "export-query-all-fields-option", value: "all-fields", checked: fieldsToExportOption === 'all-fields' }, "All fields"),
            react_1.default.createElement(compass_components_1.RadioBox, { className: selectFieldsRadioBoxStyles, id: "export-query-select-fields-option", value: "select-fields", checked: fieldsToExportOption === 'select-fields' }, "Select fields in table")),
        showProjectInfoMessage && (react_1.default.createElement(compass_components_1.Banner, { className: messageBannerStyles, dismissible: true, onClose: () => setShowProjectInfoMessage(false) },
            "You can also use the ",
            react_1.default.createElement("b", null, "Project"),
            " field in the query bar to specify which fields to return or export."))));
}
exports.FieldsToExportOptions = FieldsToExportOptions;
//# sourceMappingURL=export-field-options.js.map