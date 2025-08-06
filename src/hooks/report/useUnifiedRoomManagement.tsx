import { useCallback } from "react";
import { Report, RoomComponent } from "@/types";
import { useComponentPersistence } from "./useComponentPersistence";
import { useRoomCreation, RoomFormValues } from "./useRoomCreation";
import { useRoomNavigation } from "./useRoomNavigation";

/**
 * Unified room management hook that provides direct, reliable component saving
 * This replaces the complex debounced/immediate save duality with a single, direct path
 */
export const useUnifiedRoomManagement = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const { updateComponentInDatabase } = useComponentPersistence();
  
  const { 
    isSubmittingRoom, 
    handleAddRoom 
  } = useRoomCreation(report, setReport);
  
  const { 
    activeRoomIndex, 
    handleDeleteRoom, 
    handleNavigateRoom 
  } = useRoomNavigation(report, setReport);

  // Direct component update handler
  const handleUpdateComponent = useCallback((
    roomId: string, 
    componentId: string, 
    field: string, 
    value: string | string[]
  ) => {
    if (!report) return;

    console.log(`🔄 UnifiedRoomManagement: Updating component ${componentId} field ${field} in room ${roomId}`);

    // Update local state immediately for responsive UI
    setReport(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        rooms: prev.rooms.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              components: (room.components || []).map(comp => {
                if (comp.id === componentId) {
                  const updated = { ...comp, [field]: value };
                  console.log(`🔄 UnifiedRoomManagement: Updated component ${componentId} locally:`, updated);
                  return updated;
                }
                return comp;
              })
            };
          }
          return room;
        })
      };
    });
  }, [report, setReport]);

  // Direct component save handler
  const handleSaveComponent = useCallback(async (
    roomId: string,
    componentId: string
  ) => {
    if (!report) {
      console.error("❌ UnifiedRoomManagement: No report available for save");
      return;
    }

    console.log(`💾 UnifiedRoomManagement: Starting direct save for component ${componentId} in room ${roomId}`);

    // Find the current component data from local state
    const room = report.rooms.find(r => r.id === roomId);
    const component = room?.components?.find(c => c.id === componentId);

    if (!component) {
      console.error(`❌ UnifiedRoomManagement: Component ${componentId} not found in room ${roomId}`);
      return;
    }

    // Save directly to database
    const success = await updateComponentInDatabase(
      report.id,
      roomId,
      componentId,
      {
        description: component.description,
        conditionSummary: component.conditionSummary,
        condition: component.condition,
        cleanliness: component.cleanliness,
        notes: component.notes,
        conditionPoints: component.conditionPoints
      }
    );

    if (success) {
      console.log(`✅ UnifiedRoomManagement: Successfully saved component ${componentId}`);
      
      // Update local state to remove editing mode
      setReport(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          rooms: prev.rooms.map(room => {
            if (room.id === roomId) {
              return {
                ...room,
                components: (room.components || []).map(comp => {
                  if (comp.id === componentId) {
                    return { ...comp, isEditing: false };
                  }
                  return comp;
                })
              };
            }
            return room;
          })
        };
      });
    }
  }, [report, setReport, updateComponentInDatabase]);

  // Toggle edit mode
  const handleToggleEditMode = useCallback((roomId: string, componentId: string) => {
    if (!report) return;

    console.log(`✏️ UnifiedRoomManagement: Toggling edit mode for component ${componentId} in room ${roomId}`);

    setReport(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        rooms: prev.rooms.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              components: (room.components || []).map(comp => {
                if (comp.id === componentId) {
                  const newEditingState = !comp.isEditing;
                  console.log(`✏️ UnifiedRoomManagement: Component ${componentId} isEditing: ${comp.isEditing} -> ${newEditingState}`);
                  return { ...comp, isEditing: newEditingState };
                }
                return comp;
              })
            };
          }
          return room;
        })
      };
    });
  }, [report, setReport]);

  return {
    isSubmittingRoom,
    activeRoomIndex,
    handleAddRoom,
    handleDeleteRoom,
    handleNavigateRoom,
    handleUpdateComponent,
    handleSaveComponent,
    handleToggleEditMode,
  };
};

// Re-export the RoomFormValues type for convenience
export type { RoomFormValues };