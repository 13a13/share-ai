
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RoomCrudAPI, RoomUpdateAPI } from "@/lib/api/reports";
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
      const newRoom = await RoomCrudAPI.addRoom(
        report.id,
        values.name, // Pass the name explicitly
        values.type as RoomType
      );
      
      if (newRoom) {
        // Get default components based on room type
        const defaultComponents = getDefaultComponentsByRoomType(values.type as RoomType)
          .map(comp => createDefaultComponent(comp.name, comp.type, comp.isOptional));
        
        console.log("Default components for room type", values.type, ":", defaultComponents);
        
        // Create the room update object with all necessary properties
        const roomUpdateData: Partial<Room> = {
          name: values.name,
          type: values.type as RoomType,
          generalCondition: '',
          components: defaultComponents,
          sections: [],
          order: report.rooms.length + 1
        };
        
        console.log("Updating room with data:", roomUpdateData);
        
        // Save the updated room with components to the API
        const savedRoom = await RoomUpdateAPI.updateRoom(report.id, newRoom.id, roomUpdateData);
        
        if (savedRoom) {
          console.log("Room successfully saved with components:", savedRoom);
          
          // Update the report state with the new room including components
          setReport(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              rooms: [...prev.rooms, savedRoom],
            };
          });
          
          toast({
            title: "Room Added",
            description: `${savedRoom.name} has been added to the report with ${defaultComponents.length} default components.`,
          });
        } else {
          console.error("Failed to save room with components");
          toast({
            title: "Warning",
            description: `Room ${values.name} was created but default components may not have been added properly.`,
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Failed to create room");
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
