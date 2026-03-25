"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDataFolderPath = void 0;
const path_1 = __importDefault(require("path"));
const compass_utils_1 = require("@mongodb-js/compass-utils");
function getUserDataFolderPath() {
    const appName = (0, compass_utils_1.getAppName)();
    const basepath = (0, compass_utils_1.getStoragePath)();
    if (appName === undefined || basepath === undefined) {
        throw new Error('cannot access user data folder path');
    }
    // Todo: https://jira.mongodb.org/browse/COMPASS-7080
    // It creates nested folder with appName as folder name.
    return path_1.default.join(basepath, appName);
}
exports.getUserDataFolderPath = getUserDataFolderPath;
//# sourceMappingURL=get-user-data-file-path.js.map