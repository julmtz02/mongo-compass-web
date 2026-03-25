"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFile = void 0;
async function openFile(fileName) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
    const { shell } = require('electron');
    return shell.openPath(fileName);
}
exports.openFile = openFile;
//# sourceMappingURL=open-file.js.map