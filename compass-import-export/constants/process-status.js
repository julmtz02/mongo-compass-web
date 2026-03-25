"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETED_STATUSES = exports.FINISHED_STATUSES = exports.PROCESS_STATUS = exports.UNSPECIFIED = exports.FAILED = exports.COMPLETED_WITH_ERRORS = exports.COMPLETED = exports.CANCELED = exports.STARTED = void 0;
exports.STARTED = 'STARTED';
exports.CANCELED = 'CANCELED';
exports.COMPLETED = 'COMPLETED';
exports.COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS';
exports.FAILED = 'FAILED';
exports.UNSPECIFIED = 'UNSPECIFIED';
/**
 * Process status constants.
 */
exports.PROCESS_STATUS = {
    STARTED: exports.STARTED,
    CANCELED: exports.CANCELED,
    COMPLETED: exports.COMPLETED,
    FAILED: exports.FAILED,
    UNSPECIFIED: exports.UNSPECIFIED,
    COMPLETED_WITH_ERRORS: exports.COMPLETED_WITH_ERRORS,
};
/**
 * The finished statuses.
 */
exports.FINISHED_STATUSES = [
    exports.CANCELED,
    exports.COMPLETED,
    exports.COMPLETED_WITH_ERRORS,
    exports.FAILED,
];
exports.COMPLETED_STATUSES = [
    exports.COMPLETED,
    exports.COMPLETED_WITH_ERRORS,
];
exports.default = exports.PROCESS_STATUS;
//# sourceMappingURL=process-status.js.map