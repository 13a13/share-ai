
import { Report, Room, RoomComponent } from "@/types";
import { ReportsAPI } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string, report: Report, setReport: React.Dispatch<React.SetStateAction<Report | null>>) => {
  if (!report) return;
  
  const currentRoom = report.rooms.find(room => room.id === roomId);
  if (!currentRoom) return;
  
  try {
    // Get the inspection for this room
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, report_info')
      .eq('room_id', roomId)
      .single();
    
    if (inspection) {
      // Save general condition in report_info
      await supabase
        .from('inspections')
        .update({
          report_info: {
            // Fix: Check if inspection.report_info is an object before spreading
            ...(inspection.report_info && typeof inspection.report_info === 'object' ? inspection.report_info : {}),
            generalCondition
          }
        })
        .eq('id', inspection.id);
    }
    
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
    const { toast } = useToast();
    toast({
      title: "Error",
      description: "Failed to save general condition. Please try again.",
      variant: "destructive",
    });
  }
};

export { handleUpdateGeneralCondition };
