import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { Action, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
export type ImportPluginServices = {
    globalAppRegistry: AppRegistry;
    workspaces: WorkspacesService;
    logger: Logger;
    track: TrackFunction;
    connections: ConnectionsService;
};
export declare function configureStore(services: ImportPluginServices): import("redux").Store<import("redux").EmptyObject & {
    import: {
        isOpen: boolean;
        isInProgressMessageOpen: boolean;
        firstErrors: Error[];
        fileType: import("../constants/file-types").AcceptedFileType | "";
        fileName: string;
        errorLogFilePath: string;
        fileIsMultilineJSON: boolean;
        useHeaderLines: boolean;
        status: import("../constants/process-status").ProcessStatus;
        fileStats: null | import("fs").Stats;
        analyzeBytesProcessed: number;
        analyzeBytesTotal: number;
        delimiter: import("../csv/csv-types").Delimiter;
        newline: import("../csv/csv-types").Linebreak;
        stopOnErrors: boolean;
        ignoreBlanks: boolean;
        fields: (import("../modules/import").FieldFromCSV | {
            path: string;
            checked: boolean;
        })[];
        values: string[][];
        previewLoaded: boolean;
        exclude: string[];
        transform: [string, import("../csv/csv-types").CSVParsableFieldType][];
        abortController?: AbortController;
        analyzeAbortController?: AbortController;
        analyzeResult?: import("../import/analyze-csv-fields").AnalyzeCSVFieldsResult;
        analyzeStatus: import("../constants/process-status").ProcessStatus;
        analyzeError?: Error;
        connectionId: string;
        namespace: string;
    };
}, AnyAction> & {
    dispatch: import("redux-thunk").ThunkDispatch<any, ImportPluginServices, AnyAction>;
};
export type RootImportState = ReturnType<ReturnType<typeof configureStore>['getState']>;
export type ImportThunkAction<R, A extends Action = AnyAction> = ThunkAction<R, RootImportState, ImportPluginServices, A>;
export declare function activatePlugin(_: unknown, { globalAppRegistry, connections, workspaces, logger, track, }: ImportPluginServices, { on, cleanup, addCleanup }: ActivateHelpers): {
    store: import("redux").Store<import("redux").EmptyObject & {
        import: {
            isOpen: boolean;
            isInProgressMessageOpen: boolean;
            firstErrors: Error[];
            fileType: import("../constants/file-types").AcceptedFileType | "";
            fileName: string;
            errorLogFilePath: string;
            fileIsMultilineJSON: boolean;
            useHeaderLines: boolean;
            status: import("../constants/process-status").ProcessStatus;
            fileStats: null | import("fs").Stats;
            analyzeBytesProcessed: number;
            analyzeBytesTotal: number;
            delimiter: import("../csv/csv-types").Delimiter;
            newline: import("../csv/csv-types").Linebreak;
            stopOnErrors: boolean;
            ignoreBlanks: boolean;
            fields: (import("../modules/import").FieldFromCSV | {
                path: string;
                checked: boolean;
            })[];
            values: string[][];
            previewLoaded: boolean;
            exclude: string[];
            transform: [string, import("../csv/csv-types").CSVParsableFieldType][];
            abortController?: AbortController;
            analyzeAbortController?: AbortController;
            analyzeResult?: import("../import/analyze-csv-fields").AnalyzeCSVFieldsResult;
            analyzeStatus: import("../constants/process-status").ProcessStatus;
            analyzeError?: Error;
            connectionId: string;
            namespace: string;
        };
    }, AnyAction> & {
        dispatch: import("redux-thunk").ThunkDispatch<any, ImportPluginServices, AnyAction>;
    };
    deactivate: () => void;
};
export type ImportStore = ReturnType<typeof configureStore>;
//# sourceMappingURL=import-store.d.ts.map