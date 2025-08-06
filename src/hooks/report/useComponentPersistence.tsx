import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Report, RoomComponent } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for persisting component edits directly to the database
 * This ensures manual edits are saved and reflected in PDF generation
 */
export const useComponentPersistence = () => {
  console.log("🔧 useComponentPersistence hook initialized - timestamp:", Date.now());
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});

  const updateComponentInDatabase = async (
    reportId: string,
    roomId: string,
    componentId: string,
    updates: Partial<RoomComponent>
  ): Promise<boolean> => {
    const key = `${reportId}-${roomId}-${componentId}`;
    
    try {
      setIsUpdating(prev => ({ ...prev, [key]: true }));

      // First get the current report to modify it
      const { data: inspection } = await supabase
        .from('inspections')
        .select('room_id, report_info')
        .eq('id', reportId)
        .single();

      if (!inspection) {
        console.error("Inspection not found:", reportId);
        return false;
      }

      const reportInfo = parseReportInfo(inspection.report_info);
      const isMainRoom = inspection.room_id === roomId;

      if (isMainRoom) {
        // Update component in main room
        const components = Array.isArray(reportInfo.components) 
          ? reportInfo.components 
          : [];
          
        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              ...updates,
              // Preserve existing analysis and images
              analysis: comp.analysis || {},
              images: comp.images || []
            };
          }
          return comp;
        });
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              components: updatedComponents
            }
          })
          .eq('id', reportId);
      } else {
        // Update component in additional room
        const additionalRooms = Array.isArray(reportInfo.additionalRooms) 
          ? reportInfo.additionalRooms 
          : [];
          
        const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
        
        if (roomIndex === -1) {
          console.error("Room not found in additional rooms:", roomId);
          return false;
        }
        
        const room = additionalRooms[roomIndex];
        const components = Array.isArray(room.components) 
          ? room.components 
          : [];
        
        const updatedComponents = components.map((comp: any) => {
          if (comp.id === componentId) {
            return {
              ...comp,
              ...updates,
              // Preserve existing analysis and images
              analysis: comp.analysis || {},
              images: comp.images || []
            };
          }
          return comp;
        });
        
        additionalRooms[roomIndex] = {
          ...room,
          components: updatedComponents
        };
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms
            }
          })
          .eq('id', reportId);
      }

      toast({
        title: "Component Updated",
        description: "Changes have been saved successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error updating component:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  return {
    updateComponentInDatabase,
    isUpdating,
  };
};

// Helper function to parse report info (moved from reportTransformers)
function parseReportInfo(reportInfo: any): any {
  if (!reportInfo) return {};
  
  if (typeof reportInfo === 'string') {
    try {
      return JSON.parse(reportInfo);
    } catch {
      return {};
    }
  }
  
  return reportInfo;
}