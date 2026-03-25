export declare function showInProgressToast({ fileName, cancelImport, docsWritten, numErrors, bytesProcessed, bytesTotal, }: {
    fileName: string;
    cancelImport: () => void;
    docsWritten: number;
    numErrors: number;
    bytesProcessed: number;
    bytesTotal: number;
}): void;
export declare function showStartingToast({ fileName, cancelImport, }: {
    fileName: string;
    cancelImport: () => void;
}): void;
export declare function showCompletedToast({ docsWritten }: {
    docsWritten: number;
}): void;
export declare function showBloatedDocumentSignalToast({ onReviewDocumentsClick, }: {
    onReviewDocumentsClick?: () => void;
}): void;
export declare function showUnboundArraySignalToast({ onReviewDocumentsClick, }: {
    onReviewDocumentsClick?: () => void;
}): void;
export declare function showCompletedWithErrorsToast({ errors, docsWritten, docsProcessed, actionHandler, }: {
    errors: Error[];
    docsWritten: number;
    docsProcessed: number;
    actionHandler?: () => void;
}): void;
export declare function showCancelledToast({ errors, actionHandler, }: {
    errors: Error[];
    actionHandler?: () => void;
}): void;
export declare function showFailedToast(err: Error | undefined, showErrorDetails?: () => void): void;
//# sourceMappingURL=import-toast.d.ts.map