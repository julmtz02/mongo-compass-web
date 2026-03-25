"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureStore = configureStore;
exports.activatePlugin = activatePlugin;
const redux_1 = require("redux");
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const export_1 = require("../modules/export");
function configureStore(services) {
    return (0, redux_1.createStore)((0, redux_1.combineReducers)({
        export: export_1.exportReducer,
    }), (0, redux_1.applyMiddleware)(redux_thunk_1.default.withExtraArgument(services)));
}
function activatePlugin(_, { globalAppRegistry, connections, preferences, logger, track, }, { on, cleanup, addCleanup }) {
    const store = configureStore({
        globalAppRegistry,
        connections,
        preferences,
        logger,
        track,
    });
    on(globalAppRegistry, 'open-export', function onOpenExport({ namespace, query, exportFullCollection, aggregation, origin, }, { connectionId } = {}) {
        if (!connectionId) {
            throw new Error('Cannot open Export modal without specifying connectionId');
        }
        store.dispatch((0, export_1.openExport)({
            connectionId,
            namespace,
            query: {
                // In the query bar we use `project` instead of `projection`.
                ...query,
                ...(query?.project ? { projection: query.project } : {}),
            },
            exportFullCollection,
            aggregation,
            origin,
        }));
    });
    on(connections, 'disconnected', function (connectionId) {
        store.dispatch((0, export_1.connectionDisconnected)(connectionId));
    });
    addCleanup(() => {
        // We use close and not cancel because cancel doesn't actually cancel
        // everything
        store.dispatch((0, export_1.closeExport)());
    });
    return {
        store,
        deactivate: cleanup,
    };
}
//# sourceMappingURL=export-store.js.map