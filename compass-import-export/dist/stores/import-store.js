"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activatePlugin = exports.configureStore = void 0;
const redux_1 = require("redux");
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const import_1 = require("../modules/import");
function configureStore(services) {
    return (0, redux_1.createStore)((0, redux_1.combineReducers)({
        import: import_1.importReducer,
    }), (0, redux_1.applyMiddleware)(redux_thunk_1.default.withExtraArgument(services)));
}
exports.configureStore = configureStore;
function activatePlugin(_, { globalAppRegistry, connections, workspaces, logger, track, }, { on, cleanup, addCleanup }) {
    const store = configureStore({
        globalAppRegistry,
        workspaces,
        logger,
        track,
        connections,
    });
    addCleanup(() => {
        store.dispatch((0, import_1.cancelImport)());
    });
    on(globalAppRegistry, 'open-import', function onOpenImport({ namespace, origin }, { connectionId } = {}) {
        if (!connectionId) {
            throw new Error('Cannot open Import modal without a connectionId');
        }
        store.dispatch((0, import_1.openImport)({ namespace, origin, connectionId }));
    });
    on(connections, 'disconnected', function (connectionId) {
        store.dispatch((0, import_1.connectionDisconnected)(connectionId));
    });
    return {
        store,
        deactivate: cleanup,
    };
}
exports.activatePlugin = activatePlugin;
//# sourceMappingURL=import-store.js.map