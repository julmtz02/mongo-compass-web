import React from 'react';
import type { AcceptedFileType } from '../constants/file-types';
import type { Delimiter } from '../csv/csv-types';
type ImportOptionsProps = {
    selectImportFileName: (fileName: string) => void;
    setDelimiter: (delimiter: Delimiter) => void;
    delimiter: Delimiter;
    fileType: AcceptedFileType | '';
    fileName: string;
    stopOnErrors: boolean;
    setStopOnErrors: (stopOnErrors: boolean) => void;
    ignoreBlanks: boolean;
    setIgnoreBlanks: (ignoreBlanks: boolean) => void;
};
declare function ImportOptions({ selectImportFileName, setDelimiter, delimiter, fileType, fileName, stopOnErrors, setStopOnErrors, ignoreBlanks, setIgnoreBlanks, }: ImportOptionsProps): React.JSX.Element;
export { ImportOptions };
//# sourceMappingURL=import-options.d.ts.map