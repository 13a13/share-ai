
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, Property, RoomComponent, RoomSection } from "@/types";
import { ReportsAPI, PropertiesAPI } from "@/lib/api";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";
import { useRoomCreation } from "./useRoomCreation";
import { useRoomUpdates } from "./useRoomUpdates";
import { useBatchRoomSaving } from "@/hooks/useBatchRoomSaving";
import { useUltraFastCompletion } from "@/hooks/useUltraFastCompletion";

// Re-export ReportInfoFormValues for convenience
export type { ReportInfoFormValues };

export const useReportEditor = (reportId: string | undefined) => {
  const { toast } = useToast();
  
  // State
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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
    handleUpdateGeneralCondition,
    handleUpdateComponents,
  } = useRoomUpdates(report, setReport);

  // Combined progress from all saving operations
  const saveProgress = completionProgress || batchProgress || reportInfoProgress;

  // Load report data
  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const reportData = await ReportsAPI.getById(reportId);
        
        if (reportData) {
          setReport(reportData);
          // Get property data separately using the propertyId from the report
          const propertyData = await PropertiesAPI.getById(reportData.propertyId);
          if (propertyData) {
            setProperty(propertyData);
          }
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        setHasError(true);
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reportId, toast]);

  const handleSaveSection = async (updatedSection: RoomSection) => {
    console.log("Saving section:", updatedSection);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!report) return;
    
    try {
      // Remove room from local state
      const updatedRooms = report.rooms.filter(room => room.id !== roomId);
      const updatedReport = { ...report, rooms: updatedRooms };
      setReport(updatedReport);
      
      toast({
        title: "Room Deleted",
        description: "Room has been removed from the report.",
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateRoom = useCallback((index: number) => {
    setActiveRoomIndex(index);
  }, []);

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
