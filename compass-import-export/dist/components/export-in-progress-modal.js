"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const export_1 = require("../modules/export");
function ExportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }) {
    return (react_1.default.createElement(compass_components_1.Modal, { open: isInProgressMessageOpen, setOpen: closeInProgressMessage, "data-testid": "export-in-progress-modal" },
        react_1.default.createElement(compass_components_1.ModalHeader, { title: "Sorry, currently only one export operation is possible at a time", subtitle: "Export is disabled as there is an export already in progress." }),
        react_1.default.createElement(compass_components_1.ModalFooter, null,
            react_1.default.createElement(compass_components_1.Button, { onClick: closeInProgressMessage }, "Cancel"))));
}
const mapStateToProps = (state) => ({
    isInProgressMessageOpen: state.export.isInProgressMessageOpen,
});
exports.default = (0, react_redux_1.connect)(mapStateToProps, {
    closeInProgressMessage: export_1.closeInProgressMessage,
})(ExportInProgressModal);
//# sourceMappingURL=export-in-progress-modal.js.map