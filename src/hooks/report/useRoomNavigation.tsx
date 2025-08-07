import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RoomCrudAPI } from "@/lib/api/reports";
import { Report } from "@/types";

/**
 * Hook for handling room navigation and deletion
 */
export const useRoomNavigation = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  
  const handleDeleteRoom = async (roomId: string) => {
    if (!report) return;
    
    try {
      await RoomCrudAPI.deleteRoom(report.id, roomId);
      
      setReport(prev => {
        if (!prev) return prev;
        const newRooms = prev.rooms.filter(room => room.id !== roomId);
        const nextIndex = Math.min(activeRoomIndex, Math.max(0, newRooms.length - 1));
        if (nextIndex !== activeRoomIndex) setActiveRoomIndex(nextIndex);
        return {
          ...prev,
          rooms: newRooms,
        };
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  };
  
  const handleNavigateRoom = (index: number) => {
    if (!report) return;
    if (index >= 0 && index < (report?.rooms.length || 0)) {
      setActiveRoomIndex(index);
    }
  };

  return {
    activeRoomIndex,
    handleDeleteRoom,
    handleNavigateRoom
  };
};
