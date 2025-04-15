
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI } from "@/lib/api";
import { Report, RoomSection } from "@/types";

/**
 * Hook for managing report sections
 */
export const useReportSections = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  
  const handleSaveSection = async (updatedSection: RoomSection) => {
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => 
      room.sections.some(section => section.id === updatedSection.id)
    );
    
    if (!currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        sections: currentRoom.sections.map(section => 
          section.id === updatedSection.id ? updatedSection : section
        ),
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom);
      
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
        
        toast({
          title: "Section Saved",
          description: "Section has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving section:", error);
      toast({
        title: "Error",
        description: "Failed to save section. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handleSaveSection,
  };
};
