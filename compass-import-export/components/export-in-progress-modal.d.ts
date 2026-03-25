import React from 'react';
type InProgressModalProps = {
    closeInProgressMessage: () => void;
    isInProgressMessageOpen: boolean;
};
declare function ExportInProgressModal({ closeInProgressMessage, isInProgressMessageOpen, }: InProgressModalProps): React.JSX.Element;
declare const _default: import("react-redux").ConnectedComponent<typeof ExportInProgressModal, {
    context?: import("react-redux/es/components/Context").ReactReduxContextInstance | undefined;
    store?: import("redux").Store | undefined;
}>;
export default _default;
//# sourceMappingURL=export-in-progress-modal.d.ts.map