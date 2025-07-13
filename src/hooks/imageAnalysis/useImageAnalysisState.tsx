
/**
 * State management for image analysis operations
 */

import { useState } from "react";
import { useUltraFastBatchSaving } from "../useUltraFastBatchSaving";

export function useImageAnalysisState() {
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const { queueComponentUpdate, isSaving, getPendingCount } = useUltraFastBatchSaving();

  const updateAnalysisState = (componentId: string, isProcessing: boolean) => {
    console.log(`🔄 [IMAGE ANALYSIS STATE] Component ${componentId} processing state: ${isProcessing}`);
    setAnalysisInProgress(isProcessing);
  };

  const queueUpdate = (
    reportId: string,
    componentId: string,
    imageUrls: string[],
    description: string,
    condition: any,
    result: any
  ) => {
    queueComponentUpdate(
      reportId,
      componentId,
      imageUrls,
      description,
      condition,
      result
    );
  };

  return {
    analysisInProgress: analysisInProgress || isSaving,
    updateAnalysisState,
    queueUpdate,
    getPendingCount
  };
}
