
import { useReportData } from "./useReportData";
import { useRoomManagement, RoomFormValues } from "./useRoomManagement";
import { useReportSections } from "./useReportSections";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";

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
  };
};

// Re-export types for convenience
export type { RoomFormValues, ReportInfoFormValues };
