
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, Property, RoomComponent, RoomSection } from "@/types";
import { ReportsAPI } from "@/lib/api";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";
import { useRoomCreation } from "./useRoomCreation";
import { useUnifiedRoomManagement } from "./useUnifiedRoomManagement";
import { useBatchRoomSaving } from "@/hooks/useBatchRoomSaving";
import { useUltraFastCompletion } from "@/hooks/useUltraFastCompletion";
import { useReportData } from "./useReportData";

// Re-export ReportInfoFormValues for convenience
export type { ReportInfoFormValues };

export const useReportEditor = (reportId: string | undefined) => {
  const { toast } = useToast();
  
  const { report, setReport, property, isLoading, hasError } = useReportData(reportId);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  // Use focused hooks for specific functionality
  const { saveBatch, saveProgress: batchProgress } = useBatchRoomSaving();
  const { completeReportInstantly, completionProgress } = useUltraFastCompletion();
  
  const {
    isSaving,
    saveProgress: reportInfoProgress,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
  } = useReportInfo(report, setReport);

  const {
    isSubmittingRoom,
    handleAddRoom,
  } = useRoomCreation(report, setReport);

  const {
    handleUpdateComponent,
    handleSaveComponent,
    handleToggleEditMode,
    handleDeleteRoom,
  } = useUnifiedRoomManagement(report, setReport);

  // Removed duplicate unified component management in favor of useUnifiedRoomManagement

  // Combined progress from all saving operations
  const saveProgress = completionProgress || batchProgress || reportInfoProgress;

  // Data fetching is now centralized in useReportData

  const handleSaveSection = async (updatedSection: RoomSection) => {
    console.log("Saving section:", updatedSection);
  };
  const handleNavigateRoom = useCallback((index: number) => {
    setActiveRoomIndex(index);
  }, []);

  const handleUpdateGeneralCondition = async (roomId: string, condition: string) => {
    if (!report) return;
    const updatedRooms = report.rooms.map(r => r.id === roomId ? { ...r, generalCondition: condition } : r);
    const updatedReport = { ...report, rooms: updatedRooms };
    setReport(updatedReport);
    try {
      await ReportsAPI.updateRoom(report.id, roomId, { generalCondition: condition });
    } catch (error) {
      console.error("Error updating room condition:", error);
      toast({ title: "Error", description: "Failed to save room condition.", variant: "destructive" });
    }
  };

  const handleUpdateComponentsList = async (roomId: string, updatedComponents: RoomComponent[]) => {
    if (!report) return;
    const updatedRooms = report.rooms.map(r => r.id === roomId ? { ...r, components: updatedComponents } : r);
    const updatedReport = { ...report, rooms: updatedRooms };
    setReport(updatedReport);
  };

  return {
    report,
    property,
    isLoading,
    isSaving,
    isSubmittingRoom,
    activeRoomIndex,
    hasError,
    saveProgress,
    handleAddRoom,
    handleSaveSection,
    handleUpdateComponent,
    handleSaveComponent,
    handleToggleEditMode,
    handleDeleteRoom,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
    handleNavigateRoom,
    handleUpdateGeneralCondition,
    handleUpdateComponentsList,
  };
};
