
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI } from "@/lib/api";
import { Report, Room, RoomType, RoomComponent } from "@/types";
import { v4 as uuidv4 } from 'uuid';
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

export type RoomFormValues = {
  name: string;
  type: string;
};

/**
 * Hook for managing room operations within a report
 */
export const useRoomManagement = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  const createDefaultComponent = (name: string, type: string, isOptional: boolean): RoomComponent => {
    return {
      id: uuidv4(),
      name,
      type,
      description: "",
      condition: "fair",
      notes: "",
      images: [],
      isOptional,
    };
  };
  
  const handleAddRoom = async (values: RoomFormValues) => {
    if (!report) return;
    
    setIsSubmittingRoom(true);
    
    try {
      console.log("Adding room with values:", values);
      
      // Create a new room with the provided name and type
      const newRoom = await ReportsAPI.addRoom(
        report.id,
        values.name,
        values.type as RoomType
      );
      
      if (newRoom) {
        // Get default components based on room type
        const defaultComponents = getDefaultComponentsByRoomType(values.type as RoomType)
          .map(comp => createDefaultComponent(comp.name, comp.type, comp.isOptional));
        
        // Add components to the room object and ensure name is set correctly
        const updatedRoom = {
          ...newRoom,
          name: values.name, // Ensure name is set explicitly
          type: values.type as RoomType, // Ensure type is set explicitly
          components: defaultComponents,
        };
        
        console.log("Updating room with:", updatedRoom);
        
        // Save the updated room with components to the API
        const savedRoom = await ReportsAPI.updateRoom(report.id, newRoom.id, updatedRoom);
        
        // Update the report state with the new room including components
        setReport(prev => {
          if (!prev) return prev;
          
          // Make sure to add the updated room with components
          return {
            ...prev,
            rooms: [...prev.rooms.filter(r => r.id !== newRoom.id), savedRoom || updatedRoom],
          };
        });
        
        toast({
          title: "Room Added",
          description: `${updatedRoom.name} has been added to the report with ${defaultComponents.length} default components.`,
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
  
  const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string) => {
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => room.id === roomId);
    if (!currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        generalCondition,
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, roomId, updatedRoom);
      
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
      const updatedRoom = {
        ...currentRoom,
        components: updatedComponents,
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, roomId, updatedRoom);
      
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
      console.error("Error updating components:", error);
      toast({
        title: "Error",
        description: "Failed to update components. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    if (!report) return;
    
    try {
      await ReportsAPI.deleteRoom(report.id, roomId);
      
      setReport(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rooms: prev.rooms.filter(room => room.id !== roomId),
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
    isSubmittingRoom,
    activeRoomIndex,
    handleAddRoom,
    handleUpdateGeneralCondition,
    handleUpdateComponents,
    handleDeleteRoom,
    handleNavigateRoom,
  };
};
