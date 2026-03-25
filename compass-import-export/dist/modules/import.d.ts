/// <reference types="node" />
import fs from 'fs';
import type { Reducer } from 'redux';
import type { ProcessStatus } from '../constants/process-status';
import type { AcceptedFileType } from '../constants/file-types';
import type { Delimiter, Linebreak, CSVParsableFieldType, CSVField } from '../csv/csv-types';
import type { AnalyzeCSVFieldsResult } from '../import/analyze-csv-fields';
import type { ImportThunkAction } from '../stores/import-store';
export declare const STARTED: string;
export declare const CANCELED: string;
export declare const FINISHED: string;
export declare const FAILED: string;
export declare const ERROR_DETAILS_OPENED: string;
export declare const ERROR_DETAILS_CLOSED: string;
export declare const FILE_TYPE_SELECTED: string;
export declare const FILE_SELECTED: string;
export declare const FILE_SELECT_ERROR: string;
export declare const OPEN: string;
export declare const CLOSE: string;
export declare const OPEN_IN_PROGRESS_MESSAGE: string;
export declare const CLOSE_IN_PROGRESS_MESSAGE: string;
export declare const SET_PREVIEW: string;
export declare const SET_DELIMITER: string;
export declare const SET_GUESSTIMATED_TOTAL: string;
export declare const SET_STOP_ON_ERRORS: string;
export declare const SET_IGNORE_BLANKS: string;
export declare const TOGGLE_INCLUDE_FIELD: string;
export declare const SET_FIELD_TYPE: string;
export declare const ANALYZE_STARTED: string;
export declare const ANALYZE_FINISHED: string;
export declare const ANALYZE_FAILED: string;
export declare const ANALYZE_CANCELLED: string;
export declare const ANALYZE_PROGRESS: string;
export type FieldFromCSV = {
    isArray: boolean;
    path: string;
    checked: boolean;
    type: CSVParsableFieldType;
    result?: CSVField;
};
type FieldFromJSON = {
    path: string;
    checked: boolean;
};
type FieldType = FieldFromJSON | FieldFromCSV;
type ImportState = {
    isOpen: boolean;
    isInProgressMessageOpen: boolean;
    firstErrors: Error[];
    fileType: AcceptedFileType | '';
    fileName: string;
    errorLogFilePath: string;
    fileIsMultilineJSON: boolean;
    useHeaderLines: boolean;
    status: ProcessStatus;
    fileStats: null | fs.Stats;
    analyzeBytesProcessed: number;
    analyzeBytesTotal: number;
    delimiter: Delimiter;
    newline: Linebreak;
    stopOnErrors: boolean;
    ignoreBlanks: boolean;
    fields: FieldType[];
    values: string[][];
    previewLoaded: boolean;
    exclude: string[];
    transform: [string, CSVParsableFieldType][];
    abortController?: AbortController;
    analyzeAbortController?: AbortController;
    analyzeResult?: AnalyzeCSVFieldsResult;
    analyzeStatus: ProcessStatus;
    analyzeError?: Error;
    connectionId: string;
    namespace: string;
};
export declare const INITIAL_STATE: ImportState;
export declare const onStarted: ({ abortController, errorLogFilePath, }: {
    abortController: AbortController;
    errorLogFilePath: string;
}) => {
    type: string;
    abortController: AbortController;
    errorLogFilePath: string;
};
export declare const startImport: () => ImportThunkAction<Promise<void>>;
export declare const connectionDisconnected: (connectionId: string) => ImportThunkAction<void>;
/**
 * Cancels an active import if there is one, noop if not.
 *
 * @api public
 */
export declare const cancelImport: () => ImportThunkAction<void>;
export declare const skipCSVAnalyze: () => ImportThunkAction<void>;
/**
 * Mark a field to be included or excluded from the import.
 *
 * @param {String} path Dot notation path of the field.
 * @api public
 */
export declare const toggleIncludeField: (path: string) => {
    type: string;
    path: string;
};
/**
 * Specify the `type` values at `path` should be cast to.
 *
 * @param {String} path Dot notation accessor for value.
 * @param {String} bsonType A bson type identifier.
 * @example
 * ```javascript
 * //  Cast string _id from a csv to a bson.ObjectId
 * setFieldType('_id', 'ObjectId');
 * // Cast `{stats: {flufiness: "100"}}` to
 * // `{stats: {flufiness: 100}}`
 * setFieldType('stats.flufiness', 'Int32');
 * ```
 */
export declare const setFieldType: (path: string, bsonType: string) => {
    type: string;
    path: string;
    bsonType: string;
};
export declare const selectImportFileName: (fileName: string) => ImportThunkAction<Promise<void>>;
/**
 * Set the tabular delimiter.
 */
export declare const setDelimiter: (delimiter: Delimiter) => ImportThunkAction<Promise<void>>;
/**
 * Stop the import if mongo returns an error for a document write
 * such as a duplicate key for a unique index. In practice,
 * the cases for this being false when importing are very minimal.
 * For example, a duplicate unique key on _id is almost always caused
 * by the user attempting to resume from a previous import without
 * removing all documents sucessfully imported.
 *
 * @see import/import-writer.ts, import-utils.ts
 * @see https://www.mongodb.com/docs/database-tools/mongoimport/#std-option-mongoimport.--stopOnError
 */
export declare const setStopOnErrors: (stopOnErrors: boolean) => {
    type: string;
    stopOnErrors: boolean;
};
/**
 * Any `value` that is `''` will not have this field set in the final
 * document written to mongo.
 *
 * @see https://www.mongodb.com/docs/database-tools/mongoimport/#std-option-mongoimport.--ignoreBlanks
 */
export declare const setIgnoreBlanks: (ignoreBlanks: boolean) => {
    type: string;
    ignoreBlanks: boolean;
};
/**
 * ### Top-level modal visibility
 */
/**
 * Open the import modal.
 */
export declare const openImport: ({ connectionId, namespace, origin, }: {
    connectionId: string;
    namespace: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state';
}) => ImportThunkAction<void>;
/**
 * Close the import modal.
 * @api public
 */
export declare const closeImport: () => {
    type: string;
};
export declare const closeInProgressMessage: () => {
    type: string;
};
/**
 * The import module reducer.
 */
export declare const importReducer: Reducer<ImportState>;
export {};
//# sourceMappingURL=import.d.ts.map