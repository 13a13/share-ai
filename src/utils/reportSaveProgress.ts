
export interface SaveProgress {
  total: number;
  completed: number;
  currentOperation: string;
}

/**
 * Utilities for tracking and managing save progress
 */
export class ReportSaveProgress {
  /**
   * Create initial progress state
   */
  static createInitialProgress(): SaveProgress {
    return { total: 100, completed: 0, currentOperation: "Preparing save..." };
  }

  /**
   * Create progress for room preparation phase
   */
  static createPreparationProgress(): SaveProgress {
    return { total: 100, completed: 10, currentOperation: "Preparing room data..." };
  }

  /**
   * Create progress for room saving phase
   */
  static createRoomSavingProgress(): SaveProgress {
    return { total: 100, completed: 20, currentOperation: "Saving room data..." };
  }

  /**
   * Create progress for room batch completion
   */
  static createRoomProgress(completed: number, total: number, operation: string): SaveProgress {
    const progress = 20 + Math.round((completed / total) * 60);
    return { total: 100, completed: progress, currentOperation: operation };
  }

  /**
   * Create progress for status update phase
   */
  static createStatusUpdateProgress(): SaveProgress {
    return { total: 100, completed: 80, currentOperation: "Updating report status..." };
  }

  /**
   * Create final completion progress
   */
  static createCompletionProgress(): SaveProgress {
    return { total: 100, completed: 100, currentOperation: "Save completed!" };
  }

  /**
   * Create completion progress for report completion
   */
  static createReportCompletionProgress(): SaveProgress {
    return { total: 100, completed: 100, currentOperation: "Report completed!" };
  }

  /**
   * Create progress for marking report as completed
   */
  static createMarkingCompletedProgress(): SaveProgress {
    return { total: 100, completed: 80, currentOperation: "Marking as completed..." };
  }
}
