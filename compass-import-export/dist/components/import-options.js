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
exports.ImportOptions = void 0;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const import_file_input_1 = require("./import-file-input");
const formStyles = (0, compass_components_1.css)({
    paddingTop: compass_components_1.spacing[400],
});
const optionsHeadingStyles = (0, compass_components_1.css)({
    fontWeight: 'bold',
    marginTop: compass_components_1.spacing[400],
});
const inlineFieldStyles = (0, compass_components_1.css)({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: compass_components_1.spacing[200],
});
const inlineLabelStyles = (0, compass_components_1.css)({
    fontWeight: 'normal',
});
const delimiterSelectStyles = (0, compass_components_1.css)({
    minWidth: '120px', // fit all options without wrapping
});
const checkboxStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[200]}px 0`,
});
const delimiters = [
    {
        value: ',',
        label: 'Comma',
    },
    {
        value: '\t',
        label: 'Tab',
    },
    {
        value: ';',
        label: 'Semicolon',
    },
    {
        value: ' ',
        label: 'Space',
    },
];
function ImportOptions({ selectImportFileName, setDelimiter, delimiter, fileType, fileName, stopOnErrors, setStopOnErrors, ignoreBlanks, setIgnoreBlanks, }) {
    const handleOnSubmit = (0, react_1.useCallback)((evt) => {
        evt.preventDefault();
        evt.stopPropagation();
    }, []);
    const isCSV = fileType === 'csv';
    return (react_1.default.createElement("form", { onSubmit: handleOnSubmit, className: formStyles },
        react_1.default.createElement(import_file_input_1.ImportFileInput, { fileName: fileName, selectImportFileName: selectImportFileName }),
        react_1.default.createElement(compass_components_1.Body, { as: "h3", className: optionsHeadingStyles }, "Options"),
        isCSV && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: inlineFieldStyles },
                react_1.default.createElement(compass_components_1.Label, { id: "import-delimiter-label", htmlFor: "import-delimiter-select", className: inlineLabelStyles }, "Select delimiter"),
                react_1.default.createElement(compass_components_1.Select, { className: delimiterSelectStyles, id: "import-delimiter-select", "aria-labelledby": "import-delimiter-label", "aria-label": "Delimiter", "data-testid": "import-delimiter-select", onChange: (delimiter) => void setDelimiter(delimiter), value: delimiter, allowDeselect: false, size: "small" }, delimiters.map(({ value, label }) => (react_1.default.createElement(compass_components_1.Option, { key: value, value: value }, label))))),
            react_1.default.createElement(compass_components_1.Checkbox, { className: checkboxStyles, checked: ignoreBlanks, onChange: () => {
                    setIgnoreBlanks(!ignoreBlanks);
                }, label: "Ignore empty strings" }))),
        react_1.default.createElement(compass_components_1.Checkbox, { "data-testid": "import-stop-on-errors", className: checkboxStyles, checked: stopOnErrors, onChange: () => {
                setStopOnErrors(!stopOnErrors);
            }, label: "Stop on errors" })));
}
exports.ImportOptions = ImportOptions;
//# sourceMappingURL=import-options.js.map