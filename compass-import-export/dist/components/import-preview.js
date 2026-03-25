"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportPreview = void 0;
const react_1 = __importDefault(require("react"));
const compass_components_1 = require("@mongodb-js/compass-components");
const logger_1 = require("../utils/logger");
const csv_types_1 = require("../csv/csv-types");
const csv_utils_1 = require("../csv/csv-utils");
const debug = (0, logger_1.createDebug)('import-preview');
// the max length of a value in the preview
const MAX_VALUE_LENGTH = 80;
// the max length in a cell in the preview table
const MAX_PREVIEW_LENGTH = 1000;
const columnHeaderStyles = (0, compass_components_1.css)({
    display: 'flex',
    gap: compass_components_1.spacing[100],
    minWidth: compass_components_1.spacing[1600] * 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
});
const warningCellStylesLight = (0, compass_components_1.css)({
    backgroundColor: compass_components_1.palette.yellow.light3,
});
const warningCellStylesDark = (0, compass_components_1.css)({
    backgroundColor: compass_components_1.palette.yellow.dark3,
});
const columnNameStyles = (0, compass_components_1.css)({
    display: 'flex',
    flexDirection: 'row',
});
const fieldPathHeaderStyles = (0, compass_components_1.css)({
    maxWidth: compass_components_1.spacing[7] * 3,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
});
const cellContainerStyles = (0, compass_components_1.css)({
    padding: `${compass_components_1.spacing[200]}px ${compass_components_1.spacing[200]}px`,
});
const cellContentContainerStyles = (0, compass_components_1.css)({
    // We want our value cells to stay small for readability, so here we override LeafyGreen styles.
    minHeight: 0,
});
const cellStyles = (0, compass_components_1.css)({
    maxWidth: compass_components_1.spacing[7] * 3,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
});
const cellUncheckedStyles = (0, compass_components_1.css)({
    opacity: 0.4,
});
const headerCellStyles = (0, compass_components_1.css)({
    padding: `${compass_components_1.spacing[200]}px ${compass_components_1.spacing[200]}px`,
});
const rowIndexStyles = (0, compass_components_1.css)({
    minWidth: 0,
    color: compass_components_1.palette.gray.base,
});
const fieldTypeContainerStyles = (0, compass_components_1.css)({
    display: 'flex',
    alignItems: 'center',
    gap: compass_components_1.spacing[100],
});
const infoIconCommonStyles = (0, compass_components_1.css)({
    // Hack: Align the icon relative to the SelectBox.
    marginBottom: `-${compass_components_1.spacing[100]}px`,
    marginTop: `-${compass_components_1.spacing[100]}px`,
});
const infoIconLightStyles = (0, compass_components_1.css)({
    color: compass_components_1.palette.gray.dark2,
});
const infoIconDarkStyles = (0, compass_components_1.css)({
    color: compass_components_1.palette.gray.light2,
});
const warningIconCommonStyles = (0, compass_components_1.css)(infoIconCommonStyles, {
    marginLeft: compass_components_1.spacing[100],
    marginRight: compass_components_1.spacing[100],
    paddingTop: compass_components_1.spacing[100],
});
const warningIconLightStyles = (0, compass_components_1.css)({
    color: compass_components_1.palette.red.base,
});
const warningIconDarkStyles = (0, compass_components_1.css)({
    color: compass_components_1.palette.red.light1,
});
const typesListStyles = (0, compass_components_1.css)({
    margin: `${compass_components_1.spacing[400]}px 0`,
});
const selectStyles = (0, compass_components_1.css)({
    minWidth: compass_components_1.spacing[400] * 9,
});
const arrayTextStyles = (0, compass_components_1.css)({
    fontWeight: 'normal',
    whiteSpace: 'nowrap',
});
function fieldTypeName(type) {
    if (type === 'undefined') {
        return 'Blank';
    }
    return csv_types_1.CSVFieldTypeLabels[type];
}
function needsMixedWarning(field) {
    // Only show the warning for mixed and number types and once the user manually
    // changed the type, make the warning go away
    return (field.result &&
        ['mixed', 'number'].includes(field.result.detected) &&
        field.result.detected === field.type);
}
function needsTypeWarning(field) {
    return !!(field.result && (0, csv_utils_1.findBrokenCSVTypeExample)(field.result.types, field.type));
}
function needsWarning(field) {
    return needsMixedWarning(field) || needsTypeWarning(field);
}
function SelectFieldType({ fieldPath, selectedType, onChange, }) {
    return (react_1.default.createElement(compass_components_1.Select
    // NOTE: Leafygreen gives an error with only aria-label for select.
    , { "aria-labelledby": `toggle-import-field-label-${fieldPath}`, 
        // leafygreen bases ids inside Select off this id which is why we have it in addition to data-testid
        id: `import-preview-field-type-select-menu-${fieldPath}`, "data-testid": `import-preview-field-type-select-menu-${fieldPath}`, className: selectStyles, "aria-label": "Field type", value: selectedType, onChange: onChange, allowDeselect: false, size: "xsmall" }, Object.entries(csv_types_1.CSVFieldTypeLabels).map(([value, display]) => (react_1.default.createElement(compass_components_1.Option, { key: value, value: value }, display)))));
}
function InfoIcon() {
    const darkMode = (0, compass_components_1.useDarkMode)();
    return (react_1.default.createElement(compass_components_1.IconButton
    // NOTE: Leafygreen doesn't support aria-label and only understand "aria-labelledby" and "label" instead
    , { "aria-labelledby": "", "aria-label": "Types documentation", as: "a", className: (0, compass_components_1.cx)(infoIconCommonStyles, darkMode ? infoIconDarkStyles : infoIconLightStyles), href: "https://www.mongodb.com/docs/manual/reference/bson-types/", target: "_blank" },
        react_1.default.createElement(compass_components_1.Icon, { glyph: "InfoWithCircle" })));
}
function WarningIcon() {
    const darkMode = (0, compass_components_1.useDarkMode)();
    return (react_1.default.createElement("div", { className: (0, compass_components_1.cx)(warningIconCommonStyles, darkMode ? warningIconDarkStyles : warningIconLightStyles) },
        react_1.default.createElement(compass_components_1.Icon, { glyph: "Warning" })));
}
function MixedWarning({ result, selectedType, children: triggerChildren, }) {
    return (react_1.default.createElement(compass_components_1.Tooltip, { align: "top", justify: "middle", style: { display: 'block' }, trigger: react_1.default.createElement("div", null, triggerChildren) },
        react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(compass_components_1.Body, null,
                "This field has",
                ' ',
                selectedType === 'number'
                    ? 'mixed numeric types'
                    : 'mixed data types',
                ":"),
            react_1.default.createElement("ul", { className: typesListStyles }, Object.entries(result.types).map(([type, info]) => {
                return (react_1.default.createElement("li", { key: type },
                    fieldTypeName(type),
                    " *",
                    ' ',
                    info.count));
            })),
            react_1.default.createElement(compass_components_1.Body, null, "To standardize your data, select a different type."))));
}
function TypeWarning({ result, selectedType, children: triggerChildren, }) {
    const example = (0, csv_utils_1.findBrokenCSVTypeExample)(result.types, selectedType);
    if (!example) {
        return null;
    }
    const value = example.firstValue.length < MAX_VALUE_LENGTH
        ? example.firstValue
        : `${example.firstValue.slice(0, MAX_VALUE_LENGTH)}…`;
    return (react_1.default.createElement(compass_components_1.Tooltip, { align: "top", justify: "middle", style: { display: 'block' }, trigger: react_1.default.createElement("div", null, triggerChildren) },
        react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(compass_components_1.Body, null, "This field has these detected types:"),
            react_1.default.createElement("ul", { className: typesListStyles }, Object.entries(result.types).map(([type, info]) => {
                return (react_1.default.createElement("li", { key: type },
                    fieldTypeName(type),
                    " *",
                    ' ',
                    info.count));
            })),
            react_1.default.createElement(compass_components_1.Body, null,
                "Row ",
                example.firstRowIndex + 1,
                " contains the value",
                ' ',
                react_1.default.createElement("i", null,
                    "\"",
                    value,
                    "\""),
                ". This will cause an error for type",
                ' ',
                csv_types_1.CSVFieldTypeLabels[selectedType],
                "."))));
}
function capStringLength(value) {
    if (typeof value !== 'string') {
        return '';
    }
    if (value.length > MAX_PREVIEW_LENGTH) {
        return value.substring(0, MAX_PREVIEW_LENGTH) + '…';
    }
    return value;
}
function FieldTypeHeading({ field, onFieldCheckedChanged, setFieldType, }) {
    const children = (react_1.default.createElement("div", null,
        react_1.default.createElement("div", { className: columnNameStyles },
            react_1.default.createElement(compass_components_1.Checkbox, { "aria-labelledby": `toggle-import-field-label-${field.path}`, id: `toggle-import-field-checkbox-${field.path}`, "data-testid": `toggle-import-field-checkbox-${field.path}`, "aria-label": field.checked
                    ? `${field.path} values will be imported`
                    : `Values for ${field.path} will be ignored`, checked: field.checked, title: field.checked
                    ? `${field.path} values will be imported`
                    : `Values for ${field.path} will be ignored`, onChange: (e) => onFieldCheckedChanged(field.path, !!e.target.checked) }),
            react_1.default.createElement(compass_components_1.Label, { id: `toggle-import-field-label-${field.path}`, className: (0, compass_components_1.cx)('import-field-label', fieldPathHeaderStyles), htmlFor: `toggle-import-field-checkbox-${field.path}` },
                react_1.default.createElement("span", { title: field.path }, field.path))),
        react_1.default.createElement("div", { className: fieldTypeContainerStyles },
            field.isArray && react_1.default.createElement("span", { className: arrayTextStyles }, "Array of"),
            react_1.default.createElement(SelectFieldType, { fieldPath: field.path, selectedType: field.type, onChange: (newType) => setFieldType(field.path, newType) }),
            field.result && needsMixedWarning(field) && react_1.default.createElement(InfoIcon, null),
            field.result && needsTypeWarning(field) && react_1.default.createElement(WarningIcon, null))));
    if (field.result) {
        if (needsMixedWarning(field)) {
            return (react_1.default.createElement(MixedWarning, { result: field.result, selectedType: field.type }, children));
        }
        else if (needsTypeWarning(field)) {
            return (react_1.default.createElement(TypeWarning, { result: field.result, selectedType: field.type }, children));
        }
    }
    return children;
}
function ImportPreview({ fields, values, onFieldCheckedChanged, setFieldType, loaded, }) {
    const darkMode = (0, compass_components_1.useDarkMode)();
    if (!loaded) {
        debug('Preview unavailable: not loaded yet');
        return null;
    }
    if (!Array.isArray(fields) || !Array.isArray(values)) {
        debug('Preview unavailable: Fields or values is not an array', {
            fields,
            values,
        });
        return null;
    }
    const gapOrFields = ['', ...fields];
    const warningCellStyles = darkMode
        ? warningCellStylesDark
        : warningCellStylesLight;
    return (react_1.default.createElement(compass_components_1.Table, { shouldAlternateRowColor: true },
        react_1.default.createElement(compass_components_1.TableHead, null,
            react_1.default.createElement(compass_components_1.HeaderRow, null, gapOrFields.map((field) => {
                if (typeof field !== 'string' && 'path' in field) {
                    return (react_1.default.createElement(compass_components_1.HeaderCell, { key: `col-${field.path}`, className: (0, compass_components_1.cx)(headerCellStyles, needsWarning(field) && warningCellStyles) },
                        react_1.default.createElement("div", { className: columnHeaderStyles, "data-testid": `preview-field-header-${field.path}` },
                            react_1.default.createElement(FieldTypeHeading, { field: field, onFieldCheckedChanged: onFieldCheckedChanged, setFieldType: setFieldType }))));
                }
                else {
                    return (react_1.default.createElement(compass_components_1.HeaderCell, { key: "row-index", className: rowIndexStyles }));
                }
            }))),
        react_1.default.createElement(compass_components_1.TableBody, null, values.map((fieldValues, rowIndex) => (react_1.default.createElement(compass_components_1.Row, { key: `row-${rowIndex}` },
            react_1.default.createElement(compass_components_1.Cell, { className: (0, compass_components_1.cx)(cellContainerStyles, rowIndexStyles), contentClassName: cellContentContainerStyles, key: `rowindex-${rowIndex}` }, rowIndex + 1),
            fields.map(({ path }, fieldIndex) => (react_1.default.createElement(compass_components_1.Cell, { className: (0, compass_components_1.cx)(cellContainerStyles, needsWarning(fields[fieldIndex]) && warningCellStyles), contentClassName: cellContentContainerStyles, key: `item-${path}-${fieldIndex}` },
                react_1.default.createElement("div", { className: (0, compass_components_1.cx)(cellStyles, !fields[fieldIndex].checked && cellUncheckedStyles), title: `${capStringLength(fieldValues[fieldIndex]) || 'empty string'}` }, fieldValues[fieldIndex] === '' ? (react_1.default.createElement("i", null, "empty string")) : (capStringLength(fieldValues[fieldIndex]))))))))))));
}
exports.ImportPreview = ImportPreview;
//# sourceMappingURL=import-preview.js.map