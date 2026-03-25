/**
 * The import plugin.
 */
export declare const ImportPlugin: import("@mongodb-js/compass-app-registry").CompassPluginComponent<unknown, {
    connections: () => {
        getDataServiceForConnection: typeof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").getDataServiceForConnection;
        on: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        off: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        removeListener: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        getConnectionById(this: void, connectionId: string): (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        }) | undefined;
        current: readonly (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        })[];
        connect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        connectInNewWindow: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => void;
        saveAndConnect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        disconnect: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        createNewConnection: () => void;
        editConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        duplicateConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId, options?: {
            autoDuplicate: boolean;
        }) => void;
        saveEditedConnection: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        cancelEditConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        toggleFavoritedConnectionStatus: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        removeConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        removeAllRecentConnections: () => void;
        showNonGenuineMongoDBWarningModal: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        importConnections: (options: {
            content: string;
            options?: import("@mongodb-js/connection-storage/provider").ImportConnectionOptions;
            signal?: AbortSignal;
        }) => Promise<void>;
        refreshConnections: () => Promise<void>;
    };
    workspaces: () => import("@mongodb-js/compass-workspaces/provider").WorkspacesService;
    preferences: typeof import("compass-preferences-model/provider").usePreferencesContext;
    logger: () => import("@mongodb-js/compass-logging/provider").Logger;
    track: typeof import("@mongodb-js/compass-telemetry/provider").useTelemetry;
}, {
    store: import("redux").Store<import("redux").EmptyObject & {
        import: {
            isOpen: boolean;
            isInProgressMessageOpen: boolean;
            firstErrors: Error[];
            fileType: import("./constants/file-types").AcceptedFileType | "";
            fileName: string;
            errorLogFilePath: string;
            fileIsMultilineJSON: boolean;
            useHeaderLines: boolean;
            status: import("./constants/process-status").ProcessStatus;
            fileStats: null | import("fs").Stats;
            analyzeBytesProcessed: number;
            analyzeBytesTotal: number;
            delimiter: import("./csv/csv-types").Delimiter;
            newline: import("./csv/csv-types").Linebreak;
            stopOnErrors: boolean;
            ignoreBlanks: boolean;
            fields: (import("./modules/import").FieldFromCSV | {
                path: string;
                checked: boolean;
            })[];
            values: string[][];
            previewLoaded: boolean;
            exclude: string[];
            transform: [string, import("./csv/csv-types").CSVParsableFieldType][];
            abortController?: AbortController;
            analyzeAbortController?: AbortController;
            analyzeResult?: import("./import/analyze-csv-fields").AnalyzeCSVFieldsResult;
            analyzeStatus: import("./constants/process-status").ProcessStatus;
            analyzeError?: Error;
            connectionId: string;
            namespace: string;
        };
    }, import("redux").AnyAction> & {
        dispatch: import("redux-thunk").ThunkDispatch<any, import("./stores/import-store").ImportPluginServices, import("redux").AnyAction>;
    };
    deactivate: () => void;
}>;
/**
 * The export plugin.
 */
export declare const ExportPlugin: import("@mongodb-js/compass-app-registry").CompassPluginComponent<unknown, {
    connections: () => {
        getDataServiceForConnection: typeof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").getDataServiceForConnection;
        on: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        off: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        removeListener: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        getConnectionById(this: void, connectionId: string): (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        }) | undefined;
        current: readonly (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        })[];
        connect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        connectInNewWindow: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => void;
        saveAndConnect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        disconnect: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        createNewConnection: () => void;
        editConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        duplicateConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId, options?: {
            autoDuplicate: boolean;
        }) => void;
        saveEditedConnection: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        cancelEditConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        toggleFavoritedConnectionStatus: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        removeConnection: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        removeAllRecentConnections: () => void;
        showNonGenuineMongoDBWarningModal: (connectionId: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionId) => void;
        importConnections: (options: {
            content: string;
            options?: import("@mongodb-js/connection-storage/provider").ImportConnectionOptions;
            signal?: AbortSignal;
        }) => Promise<void>;
        refreshConnections: () => Promise<void>;
    };
    preferences: typeof import("compass-preferences-model/provider").usePreferencesContext;
    logger: () => import("@mongodb-js/compass-logging/provider").Logger;
    track: typeof import("@mongodb-js/compass-telemetry/provider").useTelemetry;
}, {
    store: import("redux").Store<import("redux").EmptyObject & {
        export: import("./modules/export").ExportState;
    }, import("redux").AnyAction> & {
        dispatch: import("redux-thunk").ThunkDispatch<any, import("./stores/export-store").ExportPluginServices, import("redux").AnyAction>;
    };
    deactivate: () => void;
}>;
//# sourceMappingURL=index.d.ts.map