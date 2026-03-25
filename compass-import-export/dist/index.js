"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPlugin = exports.ImportPlugin = void 0;
const hadron_app_registry_1 = require("hadron-app-registry");
const import_plugin_1 = __importDefault(require("./import-plugin"));
const import_store_1 = require("./stores/import-store");
const export_plugin_1 = __importDefault(require("./export-plugin"));
const export_store_1 = require("./stores/export-store");
const provider_1 = require("@mongodb-js/compass-workspaces/provider");
const provider_2 = require("compass-preferences-model/provider");
const provider_3 = require("@mongodb-js/compass-logging/provider");
const provider_4 = require("@mongodb-js/compass-telemetry/provider");
const provider_5 = require("@mongodb-js/compass-connections/provider");
/**
 * The import plugin.
 */
exports.ImportPlugin = (0, hadron_app_registry_1.registerHadronPlugin)({
    name: 'Import',
    component: import_plugin_1.default,
    activate: import_store_1.activatePlugin,
}, {
    connections: provider_5.connectionsLocator,
    workspaces: provider_1.workspacesServiceLocator,
    preferences: provider_2.preferencesLocator,
    logger: (0, provider_3.createLoggerLocator)('COMPASS-IMPORT-UI'),
    track: provider_4.telemetryLocator,
});
/**
 * The export plugin.
 */
exports.ExportPlugin = (0, hadron_app_registry_1.registerHadronPlugin)({
    name: 'Export',
    component: export_plugin_1.default,
    activate: export_store_1.activatePlugin,
}, {
    connections: provider_5.connectionsLocator,
    preferences: provider_2.preferencesLocator,
    logger: (0, provider_3.createLoggerLocator)('COMPASS-EXPORT-UI'),
    track: provider_4.telemetryLocator,
});
//# sourceMappingURL=index.js.map