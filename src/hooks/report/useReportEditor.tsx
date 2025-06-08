
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, Property, RoomComponent, RoomSection } from "@/types";
import { ReportsAPI, PropertiesAPI } from "@/lib/api";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";
import { useRoomOperations } from "./useRoomOperations";
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
    handleDeleteRoom,
    handleUpdateGeneralCondition,
  } = useRoomOperations(report, setReport);

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

  const handleUpdateComponents = async (roomId: string, updatedComponents: RoomComponent[]) => {
    if (!report) return;
    
    const updatedRooms = report.rooms.map(room => 
      room.id === roomId ? { ...room, components: updatedComponents } : room
    );
    
    const updatedReport = { ...report, rooms: updatedRooms };
    setReport(updatedReport);
    
    // Auto-save with batch processing
    try {
      const success = await saveBatch(updatedReport);
      if (!success) {
        console.error("Batch save failed");
      }
    } catch (error) {
      console.error("Error saving components:", error);
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
