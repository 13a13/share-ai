import { useToast } from "@/hooks/use-toast";
import { Report, RoomComponent } from "@/types";
import { useComponentPersistence } from "./useComponentPersistence";

/**
 * Unified hook for managing all component operations
 * Consolidates data flow and eliminates redundancies
 */
export const useUnifiedComponentManagement = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { toast } = useToast();
  const { updateComponentInDatabase, isUpdating } = useComponentPersistence();

  const updateComponentLocally = (
    roomId: string,
    componentId: string,
    updates: Partial<RoomComponent>
  ) => {
    if (!report) return;

    setReport(prevReport => {
      if (!prevReport) return prevReport;

      const updatedRooms = prevReport.rooms.map(room => {
        if (room.id === roomId && room.components) {
          const updatedComponents = room.components.map(component => {
            if (component.id === componentId) {
              return { ...component, ...updates };
            }
            return component;
          });
          return { ...room, components: updatedComponents };
        }
        return room;
      });

      return { ...prevReport, rooms: updatedRooms };
    });
  };

  const saveComponentWithPersistence = async (
    roomId: string,
    componentId: string,
    updates: Partial<RoomComponent>
  ) => {
    if (!report) return false;

    // Update locally first for immediate UI feedback
    updateComponentLocally(roomId, componentId, updates);

    // Then persist to database
    const success = await updateComponentInDatabase(
      report.id,
      roomId,
      componentId,
      updates
    );

    if (!success) {
      // Revert local changes if database update failed
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
      // TODO: Implement optimistic update rollback
    }

    return success;
  };

  const toggleComponentEditMode = (roomId: string, componentId: string) => {
    updateComponentLocally(roomId, componentId, {
      isEditing: !getComponentEditState(roomId, componentId)
    });
  };

  const getComponentEditState = (roomId: string, componentId: string): boolean => {
    if (!report) return false;
    
    const room = report.rooms.find(r => r.id === roomId);
    const component = room?.components?.find(c => c.id === componentId);
    return component?.isEditing || false;
  };

  const updateComponentField = (
    roomId: string,
    componentId: string,
    field: keyof RoomComponent,
    value: any
  ) => {
    updateComponentLocally(roomId, componentId, { [field]: value });
  };

  return {
    updateComponentLocally,
    saveComponentWithPersistence,
    toggleComponentEditMode,
    updateComponentField,
    isUpdating,
  };
};