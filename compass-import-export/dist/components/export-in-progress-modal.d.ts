import React from 'react';
type InProgressModalProps = {
    closeInProgressMessage: () => void;
    isInProgressMessageOpen: boolean;
};
declare function ExportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }: InProgressModalProps): React.JSX.Element;
declare const _default: import("react-redux").ConnectedComponent<typeof ExportInProgressModal, {
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export default _default;
//# sourceMappingURL=export-in-progress-modal.d.ts.map