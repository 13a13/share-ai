import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RoomComponent } from "@/types";
import { ComponentUpdateAPI } from "@/lib/api/reports/componentUpdateApi";

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

      const success = await ComponentUpdateAPI.updateComponent(
        reportId,
        roomId,
        componentId,
        updates
      );

      if (success) {
        toast({
          title: "Component Updated",
          description: "Changes have been saved successfully.",
        });
      }

      return success;
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