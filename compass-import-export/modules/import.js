"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importReducer = exports.closeInProgressMessage = exports.closeImport = exports.openImport = exports.setIgnoreBlanks = exports.setStopOnErrors = exports.setDelimiter = exports.selectImportFileName = exports.setFieldType = exports.toggleIncludeField = exports.skipCSVAnalyze = exports.cancelImport = exports.connectionDisconnected = exports.startImport = exports.onStarted = exports.INITIAL_STATE = exports.ANALYZE_PROGRESS = exports.ANALYZE_CANCELLED = exports.ANALYZE_FAILED = exports.ANALYZE_FINISHED = exports.ANALYZE_STARTED = exports.SET_FIELD_TYPE = exports.TOGGLE_INCLUDE_FIELD = exports.SET_IGNORE_BLANKS = exports.SET_STOP_ON_ERRORS = exports.SET_GUESSTIMATED_TOTAL = exports.SET_DELIMITER = exports.SET_PREVIEW = exports.CLOSE_IN_PROGRESS_MESSAGE = exports.OPEN_IN_PROGRESS_MESSAGE = exports.CLOSE = exports.OPEN = exports.FILE_SELECT_ERROR = exports.FILE_SELECTED = exports.FILE_TYPE_SELECTED = exports.ERROR_DETAILS_CLOSED = exports.ERROR_DETAILS_OPENED = exports.FAILED = exports.FINISHED = exports.CANCELED = exports.STARTED = void 0;
exports.getUserDataFolderPath = getUserDataFolderPath;
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const process_status_1 = __importDefault(require("../constants/process-status"));
const file_types_1 = __importDefault(require("../constants/file-types"));
const csv_utils_1 = require("../csv/csv-utils");
const guess_filetype_1 = require("../import/guess-filetype");
const list_csv_fields_1 = require("../import/list-csv-fields");
const analyze_csv_fields_1 = require("../import/analyze-csv-fields");
const import_csv_1 = require("../import/import-csv");
const import_json_1 = require("../import/import-json");
const compass_utils_1 = require("@mongodb-js/compass-utils");
const import_toast_1 = require("../components/import-toast");
const open_file_1 = require("../utils/open-file");
const compass_components_1 = require("@mongodb-js/compass-components");
const checkFileExists = (0, util_1.promisify)(fs_1.default.exists);
const getFileStats = (0, util_1.promisify)(fs_1.default.stat);
/**
 * ## Action names
 */
const PREFIX = 'import-export/import';
exports.STARTED = `${PREFIX}/STARTED`;
exports.CANCELED = `${PREFIX}/CANCELED`;
exports.FINISHED = `${PREFIX}/FINISHED`;
exports.FAILED = `${PREFIX}/FAILED`;
exports.ERROR_DETAILS_OPENED = `${PREFIX}/ERROR_DETAILS_OPENED`;
exports.ERROR_DETAILS_CLOSED = `${PREFIX}/ERROR_DETAILS_CLOSED`;
exports.FILE_TYPE_SELECTED = `${PREFIX}/FILE_TYPE_SELECTED`;
exports.FILE_SELECTED = `${PREFIX}/FILE_SELECTED`;
exports.FILE_SELECT_ERROR = `${PREFIX}/FILE_SELECT_ERROR`;
exports.OPEN = `${PREFIX}/OPEN`;
exports.CLOSE = `${PREFIX}/CLOSE`;
exports.OPEN_IN_PROGRESS_MESSAGE = `${PREFIX}/OPEN_IN_PROGRESS_MESSAGE`;
exports.CLOSE_IN_PROGRESS_MESSAGE = `${PREFIX}/CLOSE_IN_PROGRESS_MESSAGE`;
exports.SET_PREVIEW = `${PREFIX}/SET_PREVIEW`;
exports.SET_DELIMITER = `${PREFIX}/SET_DELIMITER`;
exports.SET_GUESSTIMATED_TOTAL = `${PREFIX}/SET_GUESSTIMATED_TOTAL`;
exports.SET_STOP_ON_ERRORS = `${PREFIX}/SET_STOP_ON_ERRORS`;
exports.SET_IGNORE_BLANKS = `${PREFIX}/SET_IGNORE_BLANKS`;
exports.TOGGLE_INCLUDE_FIELD = `${PREFIX}/TOGGLE_INCLUDE_FIELD`;
exports.SET_FIELD_TYPE = `${PREFIX}/SET_FIELD_TYPE`;
exports.ANALYZE_STARTED = `${PREFIX}/ANALYZE_STARTED`;
exports.ANALYZE_FINISHED = `${PREFIX}/ANALYZE_FINISHED`;
exports.ANALYZE_FAILED = `${PREFIX}/ANALYZE_FAILED`;
exports.ANALYZE_CANCELLED = `${PREFIX}/ANALYZE_CANCELLED`;
exports.ANALYZE_PROGRESS = `${PREFIX}/ANALYZE_PROGRESS`;
exports.INITIAL_STATE = {
    isOpen: false,
    isInProgressMessageOpen: false,
    firstErrors: [],
    fileName: '',
    errorLogFilePath: '',
    fileIsMultilineJSON: false,
    useHeaderLines: true,
    status: process_status_1.default.UNSPECIFIED,
    fileStats: null,
    analyzeBytesProcessed: 0,
    analyzeBytesTotal: 0,
    delimiter: ',',
    newline: '\n',
    stopOnErrors: false,
    ignoreBlanks: true,
    fields: [],
    values: [],
    previewLoaded: false,
    exclude: [],
    transform: [],
    fileType: '',
    analyzeStatus: process_status_1.default.UNSPECIFIED,
    namespace: '',
    connectionId: '',
};
const onStarted = ({ abortController, errorLogFilePath, }) => ({
    type: exports.STARTED,
    abortController,
    errorLogFilePath,
});
exports.onStarted = onStarted;
const onFinished = ({ aborted, firstErrors, }) => ({
    type: exports.FINISHED,
    aborted,
    firstErrors,
});
const onFailed = (error) => ({ type: exports.FAILED, error });
const onFileSelectError = (error) => ({
    type: exports.FILE_SELECT_ERROR,
    error,
});
function getUserDataFolderPath() {
    const basepath = (0, compass_utils_1.getStoragePath)();
    if (basepath === undefined) {
        throw new Error('cannot access user data folder path');
    }
    return basepath;
}
async function getErrorLogPath(fileName) {
    // Create the error log output file.
    const userDataPath = getUserDataFolderPath();
    const importErrorLogsPath = path_1.default.join(userDataPath, 'ImportErrorLogs');
    await fs_1.default.promises.mkdir(importErrorLogsPath, { recursive: true });
    const errorLogFileName = `import-${path_1.default.basename(fileName)}.log`;
    return path_1.default.join(importErrorLogsPath, errorLogFileName);
}
const startImport = () => {
    return async (dispatch, getState, { connections, globalAppRegistry: appRegistry, workspaces, track, logger: { log, mongoLogId, debug }, }) => {
        const startTime = Date.now();
        const { import: { fileName, fileType, fileIsMultilineJSON, fileStats, delimiter, newline, ignoreBlanks: ignoreBlanks_, stopOnErrors, exclude, transform, namespace: ns, connectionId, }, } = getState();
        const ignoreBlanks = ignoreBlanks_ && fileType === file_types_1.default.CSV;
        const fileSize = fileStats?.size || 0;
        const fields = {};
        for (const [name, type] of transform) {
            if (exclude.includes(name)) {
                continue;
            }
            fields[name] = type;
        }
        const input = fs_1.default.createReadStream(fileName, 'utf8');
        const firstErrors = [];
        let errorLogFilePath;
        let errorLogWriteStream;
        try {
            errorLogFilePath = await getErrorLogPath(fileName);
            errorLogWriteStream = errorLogFilePath
                ? fs_1.default.createWriteStream(errorLogFilePath)
                : undefined;
        }
        catch (err) {
            err.message = `unable to create import error log file: ${err.message}`;
            firstErrors.push(err);
        }
        log.info(mongoLogId(1001000080), 'Import', 'Start reading from source file', {
            ns,
            fileName,
            fileType,
            fileIsMultilineJSON,
            fileSize,
            delimiter,
            ignoreBlanks,
            stopOnErrors,
            errorLogFilePath,
            exclude,
            transform,
        });
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        dispatch((0, exports.onStarted)({
            abortController,
            errorLogFilePath: errorLogFilePath || '',
        }));
        (0, import_toast_1.showStartingToast)({
            cancelImport: () => dispatch((0, exports.cancelImport)()),
            fileName,
        });
        let numErrors = 0;
        const errorCallback = (err) => {
            numErrors += 1;
            if (firstErrors.length < 5) {
                // Only store the first few errors in memory.
                // The log file tracks all of them.
                // If we are importing a massive file with many errors we don't
                // want to run out of memory. We show the first few errors in the UI.
                firstErrors.push(err);
            }
        };
        const progressCallback = lodash_1.default.throttle(function ({ docsWritten, bytesProcessed, }) {
            (0, import_toast_1.showInProgressToast)({
                cancelImport: () => dispatch((0, exports.cancelImport)()),
                docsWritten,
                numErrors,
                fileName,
                bytesProcessed,
                bytesTotal: fileSize,
            });
        }, 1000);
        let dataService;
        let result;
        try {
            if (!connectionId) {
                throw new Error('ConnectionId not provided');
            }
            dataService = connections.getDataServiceForConnection(connectionId);
            if (fileType === 'csv') {
                result = await (0, import_csv_1.importCSV)({
                    dataService,
                    ns,
                    input,
                    output: errorLogWriteStream,
                    delimiter,
                    newline,
                    fields,
                    abortSignal,
                    progressCallback,
                    errorCallback,
                    stopOnErrors,
                    ignoreEmptyStrings: ignoreBlanks,
                });
            }
            else {
                result = await (0, import_json_1.importJSON)({
                    dataService,
                    ns,
                    input,
                    output: errorLogWriteStream,
                    abortSignal,
                    stopOnErrors,
                    jsonVariant: fileIsMultilineJSON ? 'jsonl' : 'json',
                    progressCallback,
                    errorCallback,
                });
            }
            progressCallback.flush();
        }
        catch (err) {
            track('Import Completed', {
                duration: Date.now() - startTime,
                delimiter: fileType === 'csv' ? delimiter ?? ',' : undefined,
                newline: fileType === 'csv' ? newline : undefined,
                file_type: fileType,
                all_fields: exclude.length === 0,
                stop_on_error_selected: stopOnErrors,
                number_of_docs: err.result?.docsWritten,
                success: !err,
                aborted: abortSignal.aborted,
                ignore_empty_strings: fileType === 'csv' ? ignoreBlanks : undefined,
            }, connections.getConnectionById(connectionId)?.info);
            log.error(mongoLogId(1001000081), 'Import', 'Import failed', {
                ns,
                errorLogFilePath,
                docsWritten: err.result?.docsWritten,
                error: err.message,
            });
            debug('Error while importing:', err.stack);
            progressCallback.flush();
            const errInfo = err?.writeErrors?.length && err?.writeErrors[0]?.err?.errInfo;
            (0, import_toast_1.showFailedToast)(err, errInfo &&
                (() => (0, compass_components_1.showErrorDetails)({
                    details: errInfo,
                    closeAction: 'close',
                })));
            dispatch(onFailed(err));
            return;
        }
        finally {
            errorLogWriteStream?.close();
        }
        track('Import Completed', {
            duration: Date.now() - startTime,
            delimiter: fileType === 'csv' ? delimiter ?? ',' : undefined,
            newline: fileType === 'csv' ? newline : undefined,
            file_type: fileType,
            all_fields: exclude.length === 0,
            stop_on_error_selected: stopOnErrors,
            number_of_docs: result.docsWritten,
            success: true,
            aborted: result.aborted,
            ignore_empty_strings: fileType === 'csv' ? ignoreBlanks : undefined,
        }, connections.getConnectionById(connectionId)?.info);
        log.info(mongoLogId(1001000082), 'Import', 'Import completed', {
            ns,
            docsWritten: result.docsWritten,
            docsProcessed: result.docsProcessed,
        });
        const openErrorLogFilePathActionHandler = errorLogFilePath
            ? () => {
                if (errorLogFilePath) {
                    track('Import Error Log Opened', {
                        errorCount: numErrors,
                    }, connections.getConnectionById(connectionId)?.info);
                    void (0, open_file_1.openFile)(errorLogFilePath);
                }
            }
            : undefined;
        if (result.aborted) {
            (0, import_toast_1.showCancelledToast)({
                errors: firstErrors,
                actionHandler: openErrorLogFilePathActionHandler,
            });
        }
        else {
            const onReviewDocumentsClick = appRegistry
                ? () => {
                    workspaces.openCollectionWorkspace(connectionId, ns, {
                        newTab: true,
                    });
                }
                : undefined;
            if (result.biggestDocSize > 10_000_000) {
                (0, import_toast_1.showBloatedDocumentSignalToast)({ onReviewDocumentsClick });
            }
            if (result.hasUnboundArray) {
                (0, import_toast_1.showUnboundArraySignalToast)({ onReviewDocumentsClick });
            }
            if (firstErrors.length > 0) {
                (0, import_toast_1.showCompletedWithErrorsToast)({
                    docsWritten: result.docsWritten,
                    errors: firstErrors,
                    docsProcessed: result.docsProcessed,
                    actionHandler: openErrorLogFilePathActionHandler,
                });
            }
            else {
                (0, import_toast_1.showCompletedToast)({
                    docsWritten: result.docsWritten,
                });
            }
        }
        dispatch(onFinished({
            aborted: !!result.aborted,
            firstErrors,
        }));
        const payload = {
            ns,
            size: fileSize,
            fileType,
            docsWritten: result.docsWritten,
            fileIsMultilineJSON,
            delimiter,
            ignoreBlanks,
            stopOnErrors,
            hasExcluded: exclude.length > 0,
            hasTransformed: transform.length > 0,
        };
        // Don't emit when the data service is disconnected
        if (dataService?.isConnected()) {
            appRegistry.emit('import-finished', payload, {
                connectionId,
            });
        }
    };
};
exports.startImport = startImport;
const connectionDisconnected = (connectionId) => {
    return (dispatch, getState, { logger: { debug } }) => {
        const currentConnectionId = getState().import.connectionId;
        debug('connectionDisconnected', { connectionId, currentConnectionId });
        if (connectionId === currentConnectionId) {
            dispatch((0, exports.cancelImport)());
        }
    };
};
exports.connectionDisconnected = connectionDisconnected;
/**
 * Cancels an active import if there is one, noop if not.
 *
 * @api public
 */
const cancelImport = () => {
    return (dispatch, getState, { logger: { debug } }) => {
        const { import: { abortController, analyzeAbortController }, } = getState();
        // The user could close the modal while a analyzeCSVFields() is running
        if (analyzeAbortController) {
            debug('cancelling analyzeCSVFields');
            analyzeAbortController.abort();
            debug('analyzeCSVFields canceled by user');
            dispatch({ type: exports.ANALYZE_CANCELLED });
        }
        // The user could close the modal while a importCSV() or importJSON() is running
        if (abortController) {
            debug('cancelling import');
            abortController.abort();
            debug('import canceled by user');
            dispatch({ type: exports.CANCELED });
        }
        else {
            debug('no active import to cancel.');
        }
    };
};
exports.cancelImport = cancelImport;
const skipCSVAnalyze = () => {
    return (dispatch, getState, { logger: { debug } }) => {
        const { import: { analyzeAbortController }, } = getState();
        // cancelling analyzeCSVFields() still makes it resolve, the result is just
        // based on a smaller sample size. It will still detect something based on
        // however far it got into the file.
        if (analyzeAbortController) {
            debug('cancelling analyzeCSVFields');
            analyzeAbortController.abort();
            debug('analyzeCSVFields canceled by user');
            dispatch({ type: exports.ANALYZE_CANCELLED });
        }
    };
};
exports.skipCSVAnalyze = skipCSVAnalyze;
const loadTypes = (fields, values) => {
    return async (dispatch, getState, { logger: { log, mongoLogId } }) => {
        const { fileName, delimiter, newline, ignoreBlanks, analyzeAbortController, } = getState().import;
        // if there's already an analyzeCSVFields in flight, abort that first
        if (analyzeAbortController) {
            analyzeAbortController.abort();
            dispatch((0, exports.skipCSVAnalyze)());
        }
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const fileStats = await getFileStats(fileName);
        const fileSize = fileStats?.size || 0;
        dispatch({
            type: exports.ANALYZE_STARTED,
            abortController,
            analyzeBytesTotal: fileSize,
        });
        const input = fs_1.default.createReadStream(fileName);
        const progressCallback = lodash_1.default.throttle(function ({ bytesProcessed, }) {
            dispatch({
                type: exports.ANALYZE_PROGRESS,
                analyzeBytesProcessed: bytesProcessed,
            });
        }, 1000);
        try {
            const result = await (0, analyze_csv_fields_1.analyzeCSVFields)({
                input,
                delimiter,
                newline,
                abortSignal,
                ignoreEmptyStrings: ignoreBlanks,
                progressCallback,
            });
            for (const csvField of fields) {
                csvField.type = result.fields[csvField.path].detected;
                csvField.result = result.fields[csvField.path];
            }
            dispatch({
                type: exports.SET_PREVIEW,
                fields,
                values,
            });
            dispatch({
                type: exports.ANALYZE_FINISHED,
                result,
            });
        }
        catch (err) {
            log.error(mongoLogId(1_001_000_180), 'Import', 'Failed to analyze CSV fields', err);
            dispatch({
                type: exports.ANALYZE_FAILED,
                error: err,
            });
        }
    };
};
const loadCSVPreviewDocs = () => {
    return async (dispatch, getState, { logger: { log, mongoLogId } }) => {
        const { fileName, delimiter, newline } = getState().import;
        const input = fs_1.default.createReadStream(fileName);
        try {
            const result = await (0, list_csv_fields_1.listCSVFields)({ input, delimiter, newline });
            const fieldMap = {};
            const fields = [];
            // group the array fields' cells together so that large arrays don't kill
            // performance and cause excessive horizontal scrolling
            for (const [index, name] of result.headerFields.entries()) {
                const uniqueName = (0, csv_utils_1.csvHeaderNameToFieldName)(name);
                if (fieldMap[uniqueName]) {
                    fieldMap[uniqueName].push(index);
                }
                else {
                    fieldMap[uniqueName] = [index];
                    fields.push({
                        // foo[] is an array, foo[].bar is not even though we group its
                        // preview items together.
                        isArray: uniqueName.endsWith('[]'),
                        path: uniqueName,
                        checked: true,
                        type: 'mixed',
                    });
                }
            }
            const values = [];
            for (const row of result.preview) {
                const transformed = [];
                for (const field of fields) {
                    if (fieldMap[field.path].length === 1) {
                        // if this is either not an array or an array of length one, just
                        // use the value as is
                        const cellValue = row[fieldMap[field.path][0]];
                        transformed.push(cellValue);
                    }
                    else {
                        // if multiple cells map to the same unique field, then join all the
                        // cells for the same unique field together into one array
                        const cellValues = fieldMap[field.path]
                            .map((index) => row[index])
                            .filter((value) => value.length > 0);
                        // present values in foo[] as an array
                        // present values in foo[].bar as just a list of examples
                        const previewText = field.isArray
                            ? JSON.stringify(cellValues, null, 2)
                            : cellValues.join(', ');
                        transformed.push(previewText);
                    }
                }
                values.push(transformed);
            }
            await dispatch(loadTypes(fields, values));
        }
        catch (err) {
            log.error(mongoLogId(1001000097), 'Import', 'Failed to load preview docs', err);
            // The most likely way to get here is if the file is not encoded as UTF8.
            dispatch({
                type: exports.ANALYZE_FAILED,
                error: err,
            });
        }
    };
};
/**
 * Mark a field to be included or excluded from the import.
 *
 * @param {String} path Dot notation path of the field.
 * @api public
 */
const toggleIncludeField = (path) => ({
    type: exports.TOGGLE_INCLUDE_FIELD,
    path: path,
});
exports.toggleIncludeField = toggleIncludeField;
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
const setFieldType = (path, bsonType) => {
    return {
        type: exports.SET_FIELD_TYPE,
        path: path,
        bsonType: bsonType,
    };
};
exports.setFieldType = setFieldType;
const selectImportFileName = (fileName) => {
    return async (dispatch, _getState, { logger: { log, mongoLogId } }) => {
        try {
            const exists = await checkFileExists(fileName);
            if (!exists) {
                throw new Error(`File ${fileName} not found`);
            }
            const fileStats = await getFileStats(fileName);
            const input = fs_1.default.createReadStream(fileName, 'utf8');
            const detected = await (0, guess_filetype_1.guessFileType)({ input });
            if (detected.type === 'unknown') {
                throw new Error('Cannot determine the file type');
            }
            // This is temporary. The store should just work with one fileType var
            const fileIsMultilineJSON = detected.type === 'jsonl';
            const fileType = detected.type === 'jsonl' ? 'json' : detected.type;
            dispatch({
                type: exports.FILE_SELECTED,
                delimiter: detected.type === 'csv' ? detected.csvDelimiter : undefined,
                newline: detected.type === 'csv' ? detected.newline : undefined,
                fileName,
                fileStats,
                fileIsMultilineJSON,
                fileType,
            });
            // We only ever display preview rows for CSV files underneath the field
            // type selects
            if (detected.type === 'csv') {
                await dispatch(loadCSVPreviewDocs());
            }
        }
        catch (err) {
            log.info(mongoLogId(1_001_000_189), 'Import', 'Import select file error', {
                fileName,
                error: err?.message,
            });
            if (err?.message?.includes('The encoded data was not valid for encoding utf-8')) {
                err.message = `Unable to load the file. Make sure the file is valid CSV or JSON. Error: ${err?.message}`;
            }
            dispatch(onFileSelectError(new Error(err)));
        }
    };
};
exports.selectImportFileName = selectImportFileName;
/**
 * Set the tabular delimiter.
 */
const setDelimiter = (delimiter) => {
    return async (dispatch, getState, { logger: { debug } }) => {
        const { fileName, fileType, fileIsMultilineJSON } = getState().import;
        dispatch({
            type: exports.SET_DELIMITER,
            delimiter: delimiter,
        });
        // NOTE: The preview could still be loading and then we'll have two
        // loadCSVPreviewDocs() actions being dispatched simultaneously. The newer
        // one should finish last and just override whatever the previous one gets,
        // so hopefully fine.
        if (fileType === 'csv') {
            debug('preview needs updating because delimiter changed', {
                fileName,
                fileType,
                delimiter,
                fileIsMultilineJSON,
            });
            await dispatch(loadCSVPreviewDocs());
        }
    };
};
exports.setDelimiter = setDelimiter;
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
const setStopOnErrors = (stopOnErrors) => ({
    type: exports.SET_STOP_ON_ERRORS,
    stopOnErrors: stopOnErrors,
});
exports.setStopOnErrors = setStopOnErrors;
/**
 * Any `value` that is `''` will not have this field set in the final
 * document written to mongo.
 *
 * @see https://www.mongodb.com/docs/database-tools/mongoimport/#std-option-mongoimport.--ignoreBlanks
 */
const setIgnoreBlanks = (ignoreBlanks) => ({
    type: exports.SET_IGNORE_BLANKS,
    ignoreBlanks: ignoreBlanks,
});
exports.setIgnoreBlanks = setIgnoreBlanks;
/**
 * ### Top-level modal visibility
 */
/**
 * Open the import modal.
 */
const openImport = ({ connectionId, namespace, origin, }) => {
    return (dispatch, getState, { track, connections }) => {
        const { status } = getState().import;
        if (status === 'STARTED') {
            dispatch({
                type: exports.OPEN_IN_PROGRESS_MESSAGE,
            });
            return;
        }
        track('Import Opened', { origin }, connections.getConnectionById(connectionId)?.info);
        dispatch({ type: exports.OPEN, namespace, connectionId });
    };
};
exports.openImport = openImport;
/**
 * Close the import modal.
 * @api public
 */
const closeImport = () => ({
    type: exports.CLOSE,
});
exports.closeImport = closeImport;
const closeInProgressMessage = () => ({
    type: exports.CLOSE_IN_PROGRESS_MESSAGE,
});
exports.closeInProgressMessage = closeInProgressMessage;
function csvFields(fields) {
    return fields.filter((field) => field.type !== undefined);
}
/**
 * The import module reducer.
 */
// TODO: Use Recuder<ImportState, Action> + isAction
const importReducer = (state = exports.INITIAL_STATE, action) => {
    if (action.type === exports.FILE_SELECTED) {
        return {
            ...state,
            delimiter: action.delimiter,
            newline: action.newline,
            fileName: action.fileName,
            fileType: action.fileType,
            fileStats: action.fileStats,
            fileIsMultilineJSON: action.fileIsMultilineJSON,
            status: process_status_1.default.UNSPECIFIED,
            firstErrors: [],
            abortController: undefined,
            analyzeAbortController: undefined,
            fields: [],
        };
    }
    /**
     * ## Options
     */
    if (action.type === exports.FILE_TYPE_SELECTED) {
        return {
            ...state,
            fileType: action.fileType,
        };
    }
    if (action.type === exports.SET_STOP_ON_ERRORS) {
        return {
            ...state,
            stopOnErrors: action.stopOnErrors,
        };
    }
    if (action.type === exports.SET_IGNORE_BLANKS) {
        return {
            ...state,
            ignoreBlanks: action.ignoreBlanks,
        };
    }
    if (action.type === exports.SET_DELIMITER) {
        return {
            ...state,
            delimiter: action.delimiter,
        };
    }
    /**
     * ## Preview and projection/data type options
     */
    if (action.type === exports.SET_PREVIEW) {
        const newState = {
            ...state,
            values: action.values,
            fields: action.fields,
            previewLoaded: true,
            exclude: [],
        };
        newState.transform = newState.fields
            .filter((field) => field.checked)
            .map((field) => [field.path, field.type]);
        return newState;
    }
    /**
     * When checkbox next to a field is checked/unchecked
     */
    if (action.type === exports.TOGGLE_INCLUDE_FIELD) {
        const newState = {
            ...state,
        };
        newState.fields = newState.fields.map((field) => {
            // you can't toggle a placeholder field
            field = field;
            if (field.path === action.path) {
                field.checked = !field.checked;
            }
            return field;
        });
        newState.transform = csvFields(newState.fields).map((field) => [
            field.path,
            field.type,
        ]);
        newState.exclude = newState.fields
            .filter((field) => !field.checked)
            .map((field) => field.path);
        return newState;
    }
    /**
     * Changing field type from a select dropdown.
     */
    if (action.type === exports.SET_FIELD_TYPE) {
        const newState = {
            ...state,
        };
        newState.fields = newState.fields.map((field) => {
            if (field.path === action.path) {
                // you can only set the type of a csv field
                const csvField = field;
                // If a user changes a field type, automatically check it for them
                // so they don't need an extra click or forget to click it an get frustrated
                // like I did so many times :)
                csvField.checked = true;
                csvField.type = action.bsonType;
                return csvField;
            }
            return field;
        });
        newState.transform = csvFields(newState.fields)
            .filter((field) => field.checked)
            .map((field) => [field.path, field.type]);
        newState.exclude = newState.fields
            .filter((field) => !field.checked)
            .map((field) => field.path);
        return newState;
    }
    if (action.type === exports.FILE_SELECT_ERROR) {
        return {
            ...state,
            firstErrors: [action.error],
        };
    }
    /**
     * ## Status/Progress
     */
    if (action.type === exports.FAILED) {
        return {
            ...state,
            firstErrors: [action.error],
            status: process_status_1.default.FAILED,
            abortController: undefined,
        };
    }
    if (action.type === exports.STARTED) {
        return {
            ...state,
            isOpen: false,
            firstErrors: [],
            status: process_status_1.default.STARTED,
            abortController: action.abortController,
            errorLogFilePath: action.errorLogFilePath,
        };
    }
    if (action.type === exports.FINISHED) {
        const status = action.aborted
            ? process_status_1.default.CANCELED
            : process_status_1.default.COMPLETED;
        return {
            ...state,
            status,
            firstErrors: action.firstErrors,
            abortController: undefined,
        };
    }
    if (action.type === exports.OPEN) {
        return {
            ...exports.INITIAL_STATE,
            namespace: action.namespace,
            connectionId: action.connectionId,
            isOpen: true,
        };
    }
    if (action.type === exports.CLOSE) {
        return {
            ...state,
            isOpen: false,
        };
    }
    if (action.type === exports.OPEN_IN_PROGRESS_MESSAGE) {
        return {
            ...state,
            isInProgressMessageOpen: true,
        };
    }
    if (action.type === exports.CLOSE_IN_PROGRESS_MESSAGE) {
        return {
            ...state,
            isInProgressMessageOpen: false,
        };
    }
    if (action.type === exports.ANALYZE_STARTED) {
        return {
            ...state,
            analyzeStatus: process_status_1.default.STARTED,
            analyzeAbortController: action.abortController,
            analyzeError: undefined,
            analyzeBytesProcessed: 0,
            analyzeBytesTotal: action.analyzeBytesTotal,
        };
    }
    if (action.type === exports.ANALYZE_FINISHED) {
        return {
            ...state,
            analyzeStatus: process_status_1.default.COMPLETED,
            analyzeAbortController: undefined,
            analyzeResult: action.result,
            analyzeError: undefined,
        };
    }
    if (action.type === exports.ANALYZE_FAILED) {
        return {
            ...state,
            analyzeStatus: process_status_1.default.FAILED,
            analyzeAbortController: undefined,
            analyzeError: action.error,
        };
    }
    if (action.type === exports.ANALYZE_CANCELLED) {
        return {
            ...state,
            analyzeAbortController: undefined,
            analyzeError: undefined,
        };
    }
    if (action.type === exports.ANALYZE_PROGRESS) {
        return {
            ...state,
            analyzeBytesProcessed: action.analyzeBytesProcessed,
        };
    }
    return state;
};
exports.importReducer = importReducer;
//# sourceMappingURL=import.js.map