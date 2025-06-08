
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
      const newRoom = await ReportsAPI.addRoom(report.id, roomData.name, roomData.type as RoomType);
      if (newRoom) {
        // Update the report by adding the new room to the existing rooms array
        setReport(prevReport => {
          if (!prevReport) return null;
          return {
            ...prevReport,
            rooms: [...prevReport.rooms, newRoom]
          };
        });
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
      setReport(prevReport => {
        if (!prevReport) return null;
        const updatedRooms = prevReport.rooms.filter(room => room.id !== roomId);
        return { ...prevReport, rooms: updatedRooms };
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }, [report, setReport]);

  const handleUpdateGeneralCondition = useCallback(async (roomId: string, generalCondition: string) => {
    if (!report) return;
    
    setReport(prevReport => {
      if (!prevReport) return null;
      const updatedRooms = prevReport.rooms.map(room => 
        room.id === roomId ? { ...room, generalCondition } : room
      );
      return { ...prevReport, rooms: updatedRooms };
    });
  }, [report, setReport]);

  return {
    isSubmittingRoom,
    handleAddRoom,
    handleDeleteRoom,
    handleUpdateGeneralCondition,
  };
};
