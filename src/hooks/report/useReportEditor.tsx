
import { useReportData } from "./useReportData";
import { useRoomManagement, RoomFormValues } from "./useRoomManagement";
import { useReportSections } from "./useReportSections";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";
import { useReportSummary } from "../useReportSummary";

/**
 * Main hook that combines all report editing functionality
 */
export const useReportEditor = (reportId: string | undefined) => {
  // Use the individual hooks
  const { report, setReport, property, isLoading, hasError } = useReportData(reportId);
  
  const { 
    isSubmittingRoom, 
    activeRoomIndex, 
    handleAddRoom, 
    handleUpdateGeneralCondition,
    handleUpdateComponents,
    handleDeleteRoom,
    handleNavigateRoom,
  } = useRoomManagement(report, setReport);
  
  const { handleSaveSection } = useReportSections(report, setReport);
  
  const {
    isSaving,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
  } = useReportInfo(report, setReport);

  // Add report summary hook
  const {
    summaries,
    isAnalyzing,
    generateSummaries,
    updateSummary
  } = useReportSummary(report);

  // Function to save summaries to the report
  const handleSaveSummaries = async () => {
    if (!report || !summaries) return;
    
    const updatedReport = {
      ...report,
      overallConditionSummary: summaries.overallCondition,
      overallCleaningSummary: summaries.overallCleaning,
      summaryCategoriesData: {
        walls: {
          conditionSummary: summaries.walls.conditionSummary,
          cleanlinessSummary: summaries.walls.cleanlinessSummary
        },
        ceilings: {
          conditionSummary: summaries.ceilings.conditionSummary,
          cleanlinessSummary: summaries.ceilings.cleanlinessSummary
        },
        floors: {
          conditionSummary: summaries.floors.conditionSummary,
          cleanlinessSummary: summaries.floors.cleanlinessSummary
        },
        contents: {
          conditionSummary: summaries.contents.conditionSummary,
          cleanlinessSummary: summaries.contents.cleanlinessSummary
        },
        lighting: {
          conditionSummary: summaries.lighting.conditionSummary,
          cleanlinessSummary: summaries.lighting.cleanlinessSummary
        },
        kitchen: {
          conditionSummary: summaries.kitchen.conditionSummary,
          cleanlinessSummary: summaries.kitchen.cleanlinessSummary
        }
      }
    };
    
    setReport(updatedReport);
    await handleSaveReport();
  };

  // Export the combined interface
  return {
    report,
    property,
    isLoading,
    isSaving,
    isSubmittingRoom,
    activeRoomIndex,
    hasError,
    handleAddRoom,
    handleUpdateGeneralCondition,
    handleSaveSection,
    handleUpdateComponents,
    handleDeleteRoom,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
    handleNavigateRoom,
    // Add summary-related exports
    summaries,
    isAnalyzingSummaries: isAnalyzing,
    generateReportSummaries: generateSummaries,
    updateReportSummary: updateSummary,
    handleSaveSummaries
  };
};

// Re-export types for convenience
export type { RoomFormValues, ReportInfoFormValues };
