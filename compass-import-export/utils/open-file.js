"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFile = openFile;
async function openFile(fileName) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
    const { shell } = require('electron');
    return shell.openPath(fileName);
}
//# sourceMappingURL=open-file.js.map