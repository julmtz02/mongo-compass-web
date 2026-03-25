export declare const STARTED: "STARTED";
export declare const CANCELED: "CANCELED";
export declare const COMPLETED: "COMPLETED";
export declare const COMPLETED_WITH_ERRORS: "COMPLETED_WITH_ERRORS";
export declare const FAILED: "FAILED";
export declare const UNSPECIFIED: "UNSPECIFIED";
export type ProcessStatus = typeof STARTED | typeof CANCELED | typeof COMPLETED | typeof COMPLETED_WITH_ERRORS | typeof FAILED | typeof UNSPECIFIED;
/**
 * Process status constants.
 */
export declare const PROCESS_STATUS: {
    readonly STARTED: "STARTED";
    readonly CANCELED: "CANCELED";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
    readonly UNSPECIFIED: "UNSPECIFIED";
    readonly COMPLETED_WITH_ERRORS: "COMPLETED_WITH_ERRORS";
};
/**
 * The finished statuses.
 */
export declare const FINISHED_STATUSES: ProcessStatus[];
export declare const COMPLETED_STATUSES: ProcessStatus[];
export default PROCESS_STATUS;
//# sourceMappingURL=process-status.d.ts.map