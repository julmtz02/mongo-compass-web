"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const compass_components_1 = require("@mongodb-js/compass-components");
const import_1 = require("../modules/import");
function ImportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }) {
    return (react_1.default.createElement(compass_components_1.Modal, { open: isInProgressMessageOpen, setOpen: closeInProgressMessage, "data-testid": "import-modal" },
        react_1.default.createElement(compass_components_1.ModalHeader, { title: "Sorry, currently only one import operation is possible at a time", subtitle: "Import is disabled as there is an import already in progress." }),
        react_1.default.createElement(compass_components_1.ModalFooter, null,
            react_1.default.createElement(compass_components_1.Button, { onClick: closeInProgressMessage }, "Cancel"))));
}
const mapStateToProps = (state) => ({
    isInProgressMessageOpen: state.import.isInProgressMessageOpen,
});
exports.default = (0, react_redux_1.connect)(mapStateToProps, {
    closeInProgressMessage: import_1.closeInProgressMessage,
})(ImportInProgressModal);
//# sourceMappingURL=import-in-progress-modal.js.map