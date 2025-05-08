
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
 * Hook for handling room creation within a report
 */
export const useRoomCreation = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);

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
        values.name, // Pass the name explicitly
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
          
          // Make sure to preserve existing rooms while adding the new one
          return {
            ...prev,
            rooms: [...prev.rooms, savedRoom || updatedRoom],
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

  return {
    isSubmittingRoom,
    handleAddRoom
  };
};
