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
exports.JSONFileTypeOptions = void 0;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const radioGroupStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[400]}px 0`,
});
const bannerContainerStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[200]}px 0`,
});
function JSONFileTypeOptions({ jsonFormat, setJSONFormatVariant, }) {
    const relaxedWarningBannerContainerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // When the user selects relaxed we scroll to show the warning at the bottom.
        if (jsonFormat === 'relaxed') {
            relaxedWarningBannerContainerRef.current?.scrollIntoView();
        }
    }, [jsonFormat]);
    return (react_1.default.createElement(compass_components_1.Accordion, { text: "Advanced JSON Format", "data-testid": "export-advanced-json-format" },
        react_1.default.createElement(compass_components_1.RadioGroup, { className: radioGroupStyles, "data-testid": "export-json-format-options", onChange: (event) => setJSONFormatVariant(event.target.value) },
            react_1.default.createElement(compass_components_1.Radio, { value: "default", checked: jsonFormat === 'default', description: 'Example:  { "fortyTwo": 42, "oneHalf": 0.5, "bignumber": { "$numberLong": "5000000000" } }' }, "Default Extended JSON"),
            react_1.default.createElement(compass_components_1.Radio, { value: "relaxed", checked: jsonFormat === 'relaxed', description: 'Example: { "fortyTwo": 42, "oneHalf": 0.5, "bignumber": 5000000000 }. Large numbers (>= 2^^53) will change with this format.' }, "Relaxed Extended JSON"),
            react_1.default.createElement(compass_components_1.Radio, { value: "canonical", "data-testid": "export-json-format-canonical", checked: jsonFormat === 'canonical', description: 'Example: { "fortyTwo": { "$numberInt": "42" }, "oneHalf": { "$numberDouble": "0.5" }, "bignumber": { "$numberLong": "5000000000" } }' }, "Canonical Extended JSON")),
        react_1.default.createElement(compass_components_1.Link, { href: "https://www.mongodb.com/docs/compass/current/import-export/", target: "_blank" }, "Learn more about JSON format"),
        react_1.default.createElement("div", { className: bannerContainerStyles, ref: relaxedWarningBannerContainerRef }, jsonFormat === 'relaxed' && (react_1.default.createElement(compass_components_1.Banner, { variant: "warning" }, "Large numbers (>= 2^^53) will lose precision with the relaxed EJSON format. This format is not recommended for data integrity.")))));
}
exports.JSONFileTypeOptions = JSONFileTypeOptions;
//# sourceMappingURL=export-json-format-options.js.map