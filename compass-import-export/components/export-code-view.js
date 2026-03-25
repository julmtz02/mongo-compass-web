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
exports.ExportCodeView = exports.codeElementId = void 0;
exports.UnconnectedExportCodeView = ExportCodeView;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const gather_fields_1 = require("../export/gather-fields");
const get_shell_js_string_1 = require("../utils/get-shell-js-string");
exports.codeElementId = 'export-collection-code-preview-wrapper';
const containerStyles = (0, compass_components_1.css)({
    marginBottom: compass_components_1.spacing[400],
});
const codeStyles = (0, compass_components_1.css)({
    maxHeight: '30vh',
});
function ExportCodeView({ ns, query, aggregation, fields, selectedFieldOption, }) {
    const code = (0, react_1.useMemo)(() => {
        if (aggregation) {
            return (0, get_shell_js_string_1.aggregationAsShellJSString)({
                aggregation,
                ns,
            });
        }
        if (selectedFieldOption === 'select-fields') {
            return (0, get_shell_js_string_1.queryAsShellJSString)({
                query: {
                    ...(query ?? {
                        filter: {},
                    }),
                    projection: (0, gather_fields_1.createProjectionFromSchemaFields)(Object.values(fields)
                        .filter((field) => field.selected)
                        .map((field) => field.path)),
                },
                ns,
            });
        }
        return (0, get_shell_js_string_1.queryAsShellJSString)({
            query: query ?? {
                filter: {},
            },
            ns,
        });
    }, [aggregation, fields, query, ns, selectedFieldOption]);
    return (react_1.default.createElement("div", { className: containerStyles },
        react_1.default.createElement(compass_components_1.Body, null,
            "Export results from the ",
            aggregation ? 'aggregation' : 'query',
            " below"),
        react_1.default.createElement(compass_components_1.Code, { className: codeStyles, "data-testid": "export-collection-code-preview-wrapper", id: exports.codeElementId, language: "javascript" }, code)));
}
const ConnectedExportCodeView = (0, react_redux_1.connect)((state) => ({
    ns: state.export.namespace,
    aggregation: state.export.aggregation,
    fields: state.export.fieldsToExport,
    query: state.export.query,
    selectedFieldOption: state.export.selectedFieldOption,
}), null)(ExportCodeView);
exports.ExportCodeView = ConnectedExportCodeView;
//# sourceMappingURL=export-code-view.js.map