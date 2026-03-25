import React from 'react';
type ImportInProgressModalProps = {
    closeInProgressMessage: () => void;
    isInProgressMessageOpen: boolean;
};
declare function ImportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }: ImportInProgressModalProps): React.JSX.Element;
declare const _default: import("react-redux").ConnectedComponent<typeof ImportInProgressModal, {
    context?: import("react-redux/es/components/Context").ReactReduxContextInstance | undefined;
    store?: import("redux").Store | undefined;
}>;
export default _default;
//# sourceMappingURL=import-in-progress-modal.d.ts.map