
import { useToast } from "@/components/ui/use-toast";
import { RoomUpdateAPI } from "@/lib/api/reports";
import { Report, Room, RoomComponent } from "@/types";

/**
 * Hook for handling room updates within a report
 */
export const useRoomUpdates = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();

  const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string) => {
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => room.id === roomId);
    if (!currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        generalCondition,
      };
      
      const savedRoom = await RoomUpdateAPI.updateRoom(report.id, roomId, updatedRoom);
      
      if (savedRoom) {
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(room => 
              room.id === savedRoom.id ? savedRoom : room
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error saving general condition:", error);
      toast({
        title: "Error",
        description: "Failed to save general condition. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateComponents = async (roomId: string, updatedComponents: RoomComponent[]) => {
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => room.id === roomId);
    if (!currentRoom) return;
    
    try {
      console.log("Updating components for room:", roomId, "with components:", updatedComponents);
      
      const updatedRoom = {
        ...currentRoom,
        components: updatedComponents,
      };
      
      const savedRoom = await RoomUpdateAPI.updateRoom(report.id, roomId, updatedRoom);
      
      if (savedRoom) {
        console.log("Components successfully updated for room:", roomId);
        
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(room => 
              room.id === savedRoom.id ? savedRoom : room
            ),
          };
        });
      } else {
        console.error("Failed to save room components - no saved room returned");
      }
    } catch (error) {
      console.error("Error updating components:", error);
      toast({
        title: "Error",
        description: "Failed to update components. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handleUpdateGeneralCondition,
    handleUpdateComponents
  };
};
