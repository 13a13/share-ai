
import { Report, RoomComponent } from "@/types";
import { useRoomCreation, RoomFormValues } from "./useRoomCreation";
import { useRoomUpdates } from "./useRoomUpdates";
import { useRoomNavigation } from "./useRoomNavigation";

/**
 * Main hook that combines all room management functionality
 */
export const useRoomManagement = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  // Use the individual hooks
  const { 
    isSubmittingRoom, 
    handleAddRoom 
  } = useRoomCreation(report, setReport);
  
  const { 
    handleUpdateGeneralCondition, 
    handleUpdateComponents 
  } = useRoomUpdates(report, setReport);
  
  const { 
    activeRoomIndex, 
    handleDeleteRoom, 
    handleNavigateRoom 
  } = useRoomNavigation(report, setReport);

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

// Re-export the RoomFormValues type for convenience
export type { RoomFormValues };
