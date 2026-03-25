import React from 'react';
type ImportInProgressModalProps = {
    closeInProgressMessage: () => void;
    isInProgressMessageOpen: boolean;
};
declare function ImportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }: ImportInProgressModalProps): React.JSX.Element;
declare const _default: import("react-redux").ConnectedComponent<typeof ImportInProgressModal, {
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export default _default;
//# sourceMappingURL=import-in-progress-modal.d.ts.map