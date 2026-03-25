"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = revealFile;
/**
 * A helper function for opening the file explorer UI
 * to a highlighted path of `fileName` (e.g. "Show in Finder" on macOS)
 * using the builtin electron API.
 **/
const hadron_ipc_1 = require("hadron-ipc");
function revealFile(fileName) {
    // electron.shell.showItemInFolder(filename); was crashing Finder on macOS
    // when called from the renderer process. Doing it on main rather seems to
    // work fine.
    hadron_ipc_1.ipcRenderer?.send('show-file', fileName);
}
//# sourceMappingURL=reveal-file.js.map