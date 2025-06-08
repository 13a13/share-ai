import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, Property, Room, RoomComponent, RoomSection } from "@/types";
import { ReportsAPI, PropertiesAPI } from "@/lib/api";
import { useReportInfo, ReportInfoFormValues } from "./useReportInfo";
import { useBatchRoomSaving } from "@/hooks/useBatchRoomSaving";
import { useUltraFastCompletion } from "@/hooks/useUltraFastCompletion";

export const useReportEditor = (reportId: string | undefined) => {
  const { toast } = useToast();
  
  // State
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  // Use optimized hooks
  const { saveBatch, saveProgress: batchProgress } = useBatchRoomSaving();
  const { completeReportInstantly, completionProgress } = useUltraFastCompletion();
  
  const {
    isSaving,
    saveProgress: reportInfoProgress,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
  } = useReportInfo(report, setReport);

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
        const [reportData, propertyData] = await Promise.all([
          ReportsAPI.getById(reportId),
          ReportsAPI.getPropertyByReportId(reportId)
        ]);
        
        if (reportData) {
          setReport(reportData);
        } else {
          setHasError(true);
        }
        
        if (propertyData) {
          setProperty(propertyData);
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

  // Room management functions
  const handleAddRoom = async (roomData: { name: string; type: string }) => {
    if (!report) return;
    
    setIsSubmittingRoom(true);
    try {
      const updatedReport = await ReportsAPI.addRoom(report.id, roomData);
      if (updatedReport) {
        setReport(updatedReport);
        toast({
          title: "Room Added",
          description: `${roomData.name} has been added to the report.`,
        });
      }
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!report) return;
    
    try {
      const updatedReport = await ReportsAPI.deleteRoom(report.id, roomId);
      if (updatedReport) {
        setReport(updatedReport);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  };

  const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string) => {
    if (!report) return;
    
    const updatedRooms = report.rooms.map(room => 
      room.id === roomId ? { ...room, generalCondition } : room
    );
    
    setReport({ ...report, rooms: updatedRooms });
  };

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
    await saveBatch(updatedReport);
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
