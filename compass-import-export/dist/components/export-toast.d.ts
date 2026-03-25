import type { CSVExportPhase } from '../export/export-csv';
export declare function showInProgressToast({ filePath, namespace, cancelExport, docsWritten, csvPhase, }: {
    filePath: string;
    namespace: string;
    cancelExport: () => void;
    docsWritten: number;
    csvPhase?: CSVExportPhase;
}): void;
export declare function showStartingToast({ namespace, cancelExport, }: {
    namespace: string;
    cancelExport: () => void;
}): void;
export declare function showCompletedToast({ docsWritten, filePath, }: {
    docsWritten: number;
    filePath: string;
}): void;
export declare function showCancelledToast({ docsWritten, filePath, }: {
    filePath: string;
    docsWritten: number;
}): void;
export declare function showFailedToast(err: Error | undefined): void;
//# sourceMappingURL=export-toast.d.ts.map