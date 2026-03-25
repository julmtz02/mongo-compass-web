/// <reference types="node" />
/**
 * The import plugin.
 */
export declare const ImportPlugin: import("hadron-app-registry").HadronPluginComponent<unknown, {
    connections: () => {
        getDataServiceForConnection: typeof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").getDataServiceForConnection;
        on: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        off: <K_1 extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K_1, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K_1]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        removeListener: <K_2 extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K_2, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K_2]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        getConnectionById(this: void, connectionId: string): (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        }) | undefined;
        current: readonly (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        })[];
        connect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        connectInNewWindow: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => void;
        saveAndConnect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        disconnect: (connectionId: string) => void;
        createNewConnection: () => void;
        editConnection: (connectionId: string) => void;
        duplicateConnection: (connectionId: string, options?: {
            autoDuplicate: boolean;
        } | undefined) => void;
        saveEditedConnection: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        cancelEditConnection: (connectionId: string) => {
            type: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ActionTypes.CancelEditConnection;
            connectionId: string;
        };
        toggleFavoritedConnectionStatus: (connectionId: string) => void;
        removeConnection: (connectionId: string) => void;
        removeAllRecentConnections: () => void;
        showNonGenuineMongoDBWarningModal: (connectionId: string) => void;
        importConnections: (args: {
            content: string;
            options?: import("@mongodb-js/connection-storage/dist/import-export-connection").ImportConnectionOptions | undefined;
            signal?: AbortSignal | undefined;
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
            fileType: "" | import("./constants/file-types").AcceptedFileType;
            fileName: string;
            errorLogFilePath: string;
            fileIsMultilineJSON: boolean;
            useHeaderLines: boolean;
            status: import("./constants/process-status").ProcessStatus;
            fileStats: import("fs").Stats | null;
            analyzeBytesProcessed: number;
            analyzeBytesTotal: number;
            delimiter: "," | "\t" | ";" | " ";
            newline: "\r\n" | "\n";
            stopOnErrors: boolean;
            ignoreBlanks: boolean;
            fields: (import("./modules/import").FieldFromCSV | {
                path: string;
                checked: boolean;
            })[];
            values: string[][];
            previewLoaded: boolean;
            exclude: string[];
            transform: [string, "string" | "number" | "boolean" | "int" | "long" | "double" | "date" | "objectId" | "uuid" | "regex" | "minKey" | "maxKey" | "ejson" | "null" | "binData" | "md5" | "timestamp" | "decimal" | "mixed"][];
            abortController?: AbortController | undefined;
            analyzeAbortController?: AbortController | undefined;
            analyzeResult?: import("./import/analyze-csv-fields").AnalyzeCSVFieldsResult | undefined;
            analyzeStatus: import("./constants/process-status").ProcessStatus;
            analyzeError?: Error | undefined;
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
export declare const ExportPlugin: import("hadron-app-registry").HadronPluginComponent<unknown, {
    connections: () => {
        getDataServiceForConnection: typeof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").getDataServiceForConnection;
        on: <K extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        off: <K_1 extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K_1, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K_1]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        removeListener: <K_2 extends keyof import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap>(this: void, event: K_2, listener: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventMap[K_2]) => import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionsEventEmitter;
        getConnectionById(this: void, connectionId: string): (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        }) | undefined;
        current: readonly (import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ConnectionState & {
            title: string;
        })[];
        connect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        connectInNewWindow: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => void;
        saveAndConnect: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        disconnect: (connectionId: string) => void;
        createNewConnection: () => void;
        editConnection: (connectionId: string) => void;
        duplicateConnection: (connectionId: string, options?: {
            autoDuplicate: boolean;
        } | undefined) => void;
        saveEditedConnection: (connectionInfo: import("@mongodb-js/compass-connections/provider").ConnectionInfo) => Promise<void>;
        cancelEditConnection: (connectionId: string) => {
            type: import("@mongodb-js/compass-connections/dist/stores/connections-store-redux").ActionTypes.CancelEditConnection;
            connectionId: string;
        };
        toggleFavoritedConnectionStatus: (connectionId: string) => void;
        removeConnection: (connectionId: string) => void;
        removeAllRecentConnections: () => void;
        showNonGenuineMongoDBWarningModal: (connectionId: string) => void;
        importConnections: (args: {
            content: string;
            options?: import("@mongodb-js/connection-storage/dist/import-export-connection").ImportConnectionOptions | undefined;
            signal?: AbortSignal | undefined;
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