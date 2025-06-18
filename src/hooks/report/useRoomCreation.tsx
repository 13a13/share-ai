
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
 * Hook for handling room creation within a report - ENHANCED VERSION
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
      console.log("🏠 Starting room creation process:", values);
      
      // Step 1: Create the room structure
      const newRoom = await RoomCrudAPI.addRoom(
        report.id,
        values.name,
        values.type as RoomType
      );
      
      if (!newRoom) {
        throw new Error("Failed to create room");
      }
      
      console.log("✅ Room created successfully:", newRoom.id);
      
      // Step 2: Generate default components based on room type
      const defaultComponents = getDefaultComponentsByRoomType(values.type as RoomType)
        .map(comp => createDefaultComponent(comp.name, comp.type, comp.isOptional));
      
      console.log("🔧 Generated default components:", {
        roomType: values.type,
        componentCount: defaultComponents.length,
        components: defaultComponents.map(c => ({ name: c.name, type: c.type, isOptional: c.isOptional }))
      });
      
      // Step 3: Prepare room update data with ALL necessary properties
      const roomUpdateData: Partial<Room> = {
        name: values.name,
        type: values.type as RoomType,
        generalCondition: '',
        components: defaultComponents, // ✅ CRITICAL: Ensure components are included
        sections: [],
        order: report.rooms.length + 1
      };
      
      console.log("💾 Updating room with components:", {
        roomId: newRoom.id,
        componentCount: roomUpdateData.components?.length || 0
      });
      
      // Step 4: Save the room with components to the database
      const savedRoom = await RoomUpdateAPI.updateRoom(report.id, newRoom.id, roomUpdateData);
      
      if (savedRoom) {
        console.log("✅ Room saved successfully with components:", {
          roomId: savedRoom.id,
          componentCount: savedRoom.components?.length || 0,
          roomName: savedRoom.name
        });
        
        // Step 5: Update the local report state
        setReport(prev => {
          if (!prev) return prev;
          
          const updatedReport = {
            ...prev,
            rooms: [...prev.rooms, savedRoom],
          };
          
          console.log("🔄 Updated local state - Total rooms:", updatedReport.rooms.length);
          
          return updatedReport;
        });
        
        toast({
          title: "Room Added",
          description: `${savedRoom.name} has been added with ${savedRoom.components?.length || 0} default components.`,
        });
      } else {
        console.error("❌ Failed to save room with components");
        toast({
          title: "Warning", 
          description: `Room ${values.name} was created but components may not have been added properly.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Error in room creation process:", error);
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
