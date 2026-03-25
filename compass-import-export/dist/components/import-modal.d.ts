import React from 'react';
import type { ProcessStatus } from '../constants/process-status';
import type { AcceptedFileType } from '../constants/file-types';
import type { Delimiter, CSVParsableFieldType } from '../csv/csv-types';
type ImportModalProps = {
    isOpen: boolean;
    ns: string;
    startImport: () => void;
    cancelImport: () => void;
    skipCSVAnalyze: () => void;
    closeImport: () => void;
    errors: Error[];
    status: ProcessStatus;
    /**
     * See `<ImportOptions />`
     */
    selectImportFileName: (fileName: string) => void;
    setDelimiter: (delimiter: Delimiter) => void;
    delimiter: Delimiter;
    fileType: AcceptedFileType | '';
    fileName: string;
    stopOnErrors: boolean;
    setStopOnErrors: (stopOnErrors: boolean) => void;
    ignoreBlanks: boolean;
    setIgnoreBlanks: (ignoreBlanks: boolean) => void;
    /**
     * See `<ImportPreview />`
     */
    fields: {
        isArray?: boolean;
        path: string;
        checked?: boolean;
        type?: CSVParsableFieldType;
    }[];
    values: string[][];
    toggleIncludeField: (path: string) => void;
    setFieldType: (path: string, bsonType: string) => void;
    previewLoaded: boolean;
    csvAnalyzed: boolean;
    analyzeError?: Error;
};
declare function ImportModal({ isOpen, ns, startImport, cancelImport, closeImport, errors, status, selectImportFileName, setDelimiter, delimiter, fileType, fileName, stopOnErrors, setStopOnErrors, ignoreBlanks, setIgnoreBlanks, fields, values, toggleIncludeField, setFieldType, previewLoaded, csvAnalyzed, analyzeError, }: ImportModalProps): React.JSX.Element;
/**
 * Export the connected component as the default.
 */
declare const _default: import("react-redux").ConnectedComponent<typeof ImportModal, {
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export default _default;
//# sourceMappingURL=import-modal.d.ts.map