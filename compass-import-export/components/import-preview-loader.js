"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportPreviewLoader = ImportPreviewLoader;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const import_1 = require("../modules/import");
const loaderStyles = (0, compass_components_1.css)({
    marginTop: compass_components_1.spacing[400],
    display: 'flex',
    flexDirection: 'row',
    gap: compass_components_1.spacing[100],
    alignItems: 'center',
});
const explanationTextStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[400]}px 0`,
    width: '350px',
    textAlign: 'center',
});
const analyzeStyles = (0, compass_components_1.css)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${compass_components_1.spacing[600]}px 0`,
});
const analyzeStylesDark = (0, compass_components_1.css)({
    backgroundColor: compass_components_1.palette.gray.dark3,
});
const analyzeStylesLight = (0, compass_components_1.css)({
    backgroundColor: compass_components_1.palette.gray.light3,
});
function ImportPreviewLoader({ analyzeBytesTotal, analyzeBytesProcessed, skipCSVAnalyze, }) {
    const darkMode = (0, compass_components_1.useDarkMode)();
    return (react_1.default.createElement("div", { className: (0, compass_components_1.cx)(analyzeStyles, darkMode ? analyzeStylesDark : analyzeStylesLight) },
        react_1.default.createElement(compass_components_1.Body, { weight: "medium" }, "Detecting field types"),
        analyzeBytesTotal && (react_1.default.createElement("div", { className: loaderStyles },
            react_1.default.createElement(compass_components_1.SpinLoader, null),
            react_1.default.createElement(compass_components_1.Body, null,
                Math.round((analyzeBytesProcessed / analyzeBytesTotal) * 100),
                "%"))),
        react_1.default.createElement(compass_components_1.Body, { className: explanationTextStyles }, "We are scanning your CSV file row by row to detect the field types. You can skip this step and manually assign field types at any point during the process."),
        react_1.default.createElement(compass_components_1.Button, { "data-testid": "skip-csv-analyze-button", onClick: skipCSVAnalyze }, "Skip")));
}
/**
 * Map the state of the store to component properties.
 */
const mapStateToProps = (state) => ({
    analyzeBytesProcessed: state.import.analyzeBytesProcessed,
    analyzeBytesTotal: state.import.analyzeBytesTotal,
});
/**
 * Export the connected component as the default.
 */
exports.default = (0, react_redux_1.connect)(mapStateToProps, {
    skipCSVAnalyze: import_1.skipCSVAnalyze,
})(ImportPreviewLoader);
//# sourceMappingURL=import-preview-loader.js.map