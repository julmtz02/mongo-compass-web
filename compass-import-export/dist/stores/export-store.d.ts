import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
export declare function configureStore(services: ExportPluginServices): import("redux").Store<import("redux").EmptyObject & {
    export: import("../modules/export").ExportState;
}, AnyAction> & {
    dispatch: import("redux-thunk").ThunkDispatch<any, ExportPluginServices, AnyAction>;
};
export type RootExportState = ReturnType<ReturnType<typeof configureStore>['getState']>;
export type ExportPluginServices = {
    globalAppRegistry: AppRegistry;
    connections: ConnectionsService;
    preferences: PreferencesAccess;
    logger: Logger;
    track: TrackFunction;
};
export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<R, RootExportState, ExportPluginServices, A>;
export declare function activatePlugin(_: unknown, { globalAppRegistry, connections, preferences, logger, track, }: ExportPluginServices, { on, cleanup, addCleanup }: ActivateHelpers): {
    store: import("redux").Store<import("redux").EmptyObject & {
        export: import("../modules/export").ExportState;
    }, AnyAction> & {
        dispatch: import("redux-thunk").ThunkDispatch<any, ExportPluginServices, AnyAction>;
    };
    deactivate: () => void;
};
export type ExportStore = ReturnType<typeof configureStore>;
//# sourceMappingURL=export-store.d.ts.map