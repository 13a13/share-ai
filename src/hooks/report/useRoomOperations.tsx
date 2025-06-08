
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Report, RoomType } from "@/types";
import { ReportsAPI } from "@/lib/api";

/**
 * Focused hook for room CRUD operations
 */
export const useRoomOperations = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);

  const handleAddRoom = useCallback(async (roomData: { name: string; type: string }) => {
    if (!report) return;
    
    setIsSubmittingRoom(true);
    try {
      const updatedReport = await ReportsAPI.addRoom(report.id, roomData.name, roomData.type as RoomType);
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
  }, [report, setReport, toast]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!report) return;
    
    try {
      await ReportsAPI.deleteRoom(report.id, roomId);
      // Update the local state by removing the deleted room
      const updatedRooms = report.rooms.filter(room => room.id !== roomId);
      setReport({ ...report, rooms: updatedRooms });
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }, [report, setReport]);

  const handleUpdateGeneralCondition = useCallback(async (roomId: string, generalCondition: string) => {
    if (!report) return;
    
    const updatedRooms = report.rooms.map(room => 
      room.id === roomId ? { ...room, generalCondition } : room
    );
    
    setReport({ ...report, rooms: updatedRooms });
  }, [report, setReport]);

  return {
    isSubmittingRoom,
    handleAddRoom,
    handleDeleteRoom,
    handleUpdateGeneralCondition,
  };
};
