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
exports.ExportSelectFields = void 0;
exports.UnconnectedExportSelectFields = ExportSelectFields;
const react_1 = __importStar(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const react_redux_1 = require("react-redux");
const export_1 = require("../modules/export");
const headerContainerStyles = (0, compass_components_1.css)({
    display: 'flex',
    flexDirection: 'column',
    marginBottom: compass_components_1.spacing[400],
    marginTop: compass_components_1.spacing[200],
    gap: compass_components_1.spacing[200],
});
const tableContainerStyles = (0, compass_components_1.css)({
    maxHeight: compass_components_1.spacing[7] * 3,
    overflow: 'auto',
});
const smallCellContainerStyle = (0, compass_components_1.css)({
    width: compass_components_1.spacing[800],
    margin: '0 auto',
});
const textInputStyles = (0, compass_components_1.css)({
    padding: `${compass_components_1.spacing[100]}px 0`,
    minWidth: compass_components_1.spacing[7] * 3,
});
const enterToAddStyles = (0, compass_components_1.css)({
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: compass_components_1.spacing[200],
});
const placeholderStyles = (0, compass_components_1.css)({
    margin: compass_components_1.spacing[100],
});
const retryButtonContainerStyles = (0, compass_components_1.css)({
    margin: compass_components_1.spacing[200],
    textAlign: 'center',
});
const addNewFieldRowStyles = (0, compass_components_1.css)({
    marginBottom: compass_components_1.spacing[800],
});
const loadingPlaceholderCount = 6;
const loadingPlaceholderItems = Array.from({
    length: loadingPlaceholderCount,
}).map((value, index) => index);
const MAX_FIELDS_TO_SHOW_DEFAULT = 100;
const FIELDS_TO_SHOW_INCREASE = 100;
function LoadingTable() {
    return (react_1.default.createElement(compass_components_1.Table, { shouldAlternateRowColor: true },
        react_1.default.createElement(compass_components_1.TableHead, null,
            react_1.default.createElement(compass_components_1.HeaderRow, null,
                react_1.default.createElement(compass_components_1.HeaderCell, { className: smallCellContainerStyle, key: "checkbox" },
                    react_1.default.createElement(compass_components_1.Checkbox, { "aria-label": "Select all fields", disabled: true, checked: false, onChange: () => {
                            /* noop */
                        } })),
                react_1.default.createElement(compass_components_1.HeaderCell, { key: "field-name" }, "Field Name"))),
        react_1.default.createElement(compass_components_1.TableBody, null, loadingPlaceholderItems.map((index) => (react_1.default.createElement(compass_components_1.Row, { key: index },
            react_1.default.createElement(compass_components_1.Cell, null,
                react_1.default.createElement(compass_components_1.Placeholder, { className: placeholderStyles, style: {
                        // Fade to transparent as we go down.
                        opacity: (loadingPlaceholderCount - index) / loadingPlaceholderCount,
                    }, key: index, minChar: 30, maxChar: 40 }))))))));
}
function ExportSelectFields({ errorLoadingFieldsToExport, isLoading, fields, addFieldToExport, selectFieldsToExport, toggleFieldToExport, toggleExportAllSelectedFields, }) {
    const newFieldRef = (0, react_1.useRef)(null);
    const [maxFieldsToShow, setMaxFieldsToShow] = (0, react_1.useState)(MAX_FIELDS_TO_SHOW_DEFAULT);
    // Track the fields length so we know when to auto-focus
    // the add field input when a new field is added.
    const lastRenderedFieldsLength = (0, react_1.useRef)(0);
    const [autoScrollNewFieldInput, setAutoScrollNewFieldInput] = (0, react_1.useState)(false);
    const fieldKeys = (0, react_1.useMemo)(() => Object.keys(fields), [fields]);
    const isEveryFieldChecked = (0, react_1.useMemo)(() => {
        return Object.keys(fields).every((f) => fields[f].selected);
    }, [fields]);
    const onAddNewFieldButtonClicked = (0, react_1.useCallback)(() => {
        if (newFieldRef.current) {
            newFieldRef.current.scrollIntoView();
            newFieldRef.current.focus();
        }
    }, []);
    const handleFieldCheckboxChange = (0, react_1.useCallback)((evt) => {
        toggleFieldToExport(`${evt.target.name}`, !fields[`${evt.target.name}`].selected);
    }, [toggleFieldToExport, fields]);
    const handleAddFieldSubmit = (0, react_1.useCallback)((evt) => {
        if (evt.key === 'Enter') {
            addFieldToExport(evt.target.value.split('.'));
        }
    }, [addFieldToExport]);
    (0, react_1.useEffect)(() => {
        if (!autoScrollNewFieldInput) {
            return;
        }
        if (newFieldRef.current) {
            // Focus and scroll to the add new field input.
            newFieldRef.current.scrollIntoView();
            newFieldRef.current.focus();
        }
        setAutoScrollNewFieldInput(false);
    }, [autoScrollNewFieldInput]);
    (0, react_1.useEffect)(() => {
        if (lastRenderedFieldsLength.current !== 0 &&
            fieldKeys.length > lastRenderedFieldsLength.current) {
            setAutoScrollNewFieldInput(true);
        }
        lastRenderedFieldsLength.current = fieldKeys.length;
    }, [fieldKeys]);
    const { fieldsToRender, hasMoreFieldsToShow } = (0, react_1.useMemo)(() => {
        let fieldsShown = 0;
        let hasMoreFieldsToShow = false;
        const fieldsToRender = fieldKeys
            .filter(
        // When a key has a parent that is already checked it will
        // already be included in the projection, so we hide them.
        (fieldKey) => {
            const path = [];
            if (hasMoreFieldsToShow && fieldsShown >= maxFieldsToShow) {
                // We limit the amount of fields shown so that
                // we don't freeze when rendering a lot of fields.
                return false;
            }
            for (const fieldName of fields[fieldKey].path) {
                path.push(fieldName);
                const fieldId = (0, export_1.getIdForSchemaPath)(path);
                if (fields[fieldId]?.selected && fieldId !== fieldKey) {
                    return false;
                }
            }
            if (fieldsShown >= maxFieldsToShow) {
                hasMoreFieldsToShow = true;
                return false;
            }
            fieldsShown++;
            return true;
        })
            .map((fieldKey, index) => ({
            fieldKey,
            fieldLabel: fields[fieldKey].path.join('.'),
            checked: !!fields[fieldKey].selected,
            index,
        }));
        return {
            fieldsToRender,
            hasMoreFieldsToShow,
        };
    }, [fields, fieldKeys, maxFieldsToShow]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: headerContainerStyles },
            react_1.default.createElement(compass_components_1.Body, { weight: "medium" }, "Select Fields"),
            react_1.default.createElement(compass_components_1.Body, null,
                "The fields in the table below are from a ",
                react_1.default.createElement("b", null, "sample"),
                " of documents in the collection. Add missing fields you want to export."),
            react_1.default.createElement("div", null,
                react_1.default.createElement(compass_components_1.Button, { variant: "primary", leftGlyph: react_1.default.createElement(compass_components_1.Icon, { glyph: "Plus" }), "data-testid": "export-add-new-field-button", size: "xsmall", disabled: isLoading, onClick: onAddNewFieldButtonClicked }, "Add new field"))),
        react_1.default.createElement("div", { className: tableContainerStyles, "data-testid": "export-fields-table-container" }, isLoading ? (react_1.default.createElement(LoadingTable, null)) : (react_1.default.createElement(compass_components_1.Table, { shouldAlternateRowColor: true },
            react_1.default.createElement(compass_components_1.TableHead, null,
                react_1.default.createElement(compass_components_1.HeaderRow, null,
                    react_1.default.createElement(compass_components_1.HeaderCell, { className: smallCellContainerStyle, key: "checkbox" },
                        react_1.default.createElement(compass_components_1.Checkbox, { "data-testid": "export-fields-select-all-table-checkbox", "aria-label": isEveryFieldChecked
                                ? 'Deselect all fields'
                                : 'Select all fields', title: isEveryFieldChecked
                                ? 'Deselect all fields'
                                : 'Select all fields', checked: isEveryFieldChecked, onChange: toggleExportAllSelectedFields })),
                    react_1.default.createElement(compass_components_1.HeaderCell, { key: "field-name" }, "Field Name"))),
            react_1.default.createElement(compass_components_1.TableBody, null,
                fieldsToRender.map((field) => (react_1.default.createElement(compass_components_1.Row, { key: field.fieldKey },
                    react_1.default.createElement(compass_components_1.Cell, { className: smallCellContainerStyle },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement(compass_components_1.Checkbox, { "aria-label": `${field.checked ? 'Exclude' : 'Include'} ${field.fieldLabel} in exported collection`, "aria-labelledby": `export-field-checkbox-${field.fieldKey}-label`, id: `export-field-checkbox-${field.fieldKey}`, checked: field.checked, name: field.fieldKey, onChange: handleFieldCheckboxChange }))),
                    react_1.default.createElement(compass_components_1.Cell, null,
                        react_1.default.createElement(compass_components_1.Label, { htmlFor: `export-field-checkbox-${field.fieldKey}`, id: `export-field-checkbox-${field.fieldKey}-label` }, field.fieldLabel))))),
                hasMoreFieldsToShow && (react_1.default.createElement(compass_components_1.Row, { className: addNewFieldRowStyles, key: ".__show-more-fields" },
                    react_1.default.createElement(compass_components_1.Cell, { className: smallCellContainerStyle },
                        react_1.default.createElement("div", null)),
                    react_1.default.createElement(compass_components_1.Cell, null,
                        react_1.default.createElement(compass_components_1.Button, { "data-testid": "show-more-fields-export-button", onClick: () => setMaxFieldsToShow(maxFieldsToShow + FIELDS_TO_SHOW_INCREASE), size: "small" },
                            "Show ",
                            FIELDS_TO_SHOW_INCREASE,
                            " more fields")))),
                react_1.default.createElement(compass_components_1.Row, { className: addNewFieldRowStyles, key: ".__add-new-field" },
                    react_1.default.createElement(compass_components_1.Cell, { className: smallCellContainerStyle },
                        react_1.default.createElement("div", null)),
                    react_1.default.createElement(compass_components_1.Cell, null,
                        react_1.default.createElement(compass_components_1.TextInput, { "aria-labelledby": "enter-to-add-field-export", "aria-label": "Enter a field to include in the export", type: "text", className: textInputStyles, ref: newFieldRef, placeholder: "Add field", onKeyDown: handleAddFieldSubmit, sizeVariant: "small" }),
                        react_1.default.createElement("div", { className: enterToAddStyles },
                            react_1.default.createElement(compass_components_1.Disclaimer, { id: "enter-to-add-field-export" }, "Press \"Enter\" to add field")))))))),
        !!errorLoadingFieldsToExport && (react_1.default.createElement("div", { className: retryButtonContainerStyles },
            react_1.default.createElement(compass_components_1.ErrorSummary, { errors: `Unable to load fields to export: ${errorLoadingFieldsToExport}`, onAction: selectFieldsToExport, actionText: "Retry" })))));
}
const ConnectedExportSelectFields = (0, react_redux_1.connect)((state) => ({
    errorLoadingFieldsToExport: state.export.errorLoadingFieldsToExport,
    fields: state.export.fieldsToExport,
    isLoading: !!state.export.fieldsToExportAbortController,
}), {
    selectFieldsToExport: export_1.selectFieldsToExport,
    addFieldToExport: export_1.addFieldToExport,
    toggleFieldToExport: export_1.toggleFieldToExport,
    toggleExportAllSelectedFields: export_1.toggleExportAllSelectedFields,
})(ExportSelectFields);
exports.ExportSelectFields = ConnectedExportSelectFields;
//# sourceMappingURL=export-select-fields.js.map