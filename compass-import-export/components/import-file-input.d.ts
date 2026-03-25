import React from 'react';
type ImportFileInputProps = {
    autoOpen?: boolean;
    onCancel?: () => void;
    selectImportFileName: (fileName: string) => void;
    fileName: string;
};
declare function ImportFileInput({ autoOpen, onCancel, selectImportFileName, fileName, }: ImportFileInputProps): React.JSX.Element;
export { ImportFileInput };
//# sourceMappingURL=import-file-input.d.ts.map