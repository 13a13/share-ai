
import { Room, RoomComponent } from "@/types";

/**
 * Calculate the completion percentage for a room
 * @param room The room to calculate completion for
 * @returns An object containing the completion percentage and whether the room is complete
 */
export function calculateRoomCompletion(room: Room): { 
  completionPercentage: number;
  isComplete: boolean;
} {
  // Calculate completion percentage for components
  const requiredComponents = room.components?.filter(c => !c.isOptional) || [];
  const filledRequiredComponents = requiredComponents.filter(c => 
    c.description && c.condition && (c.images.length > 0 || c.notes)
  );
  
  const completionPercentage = requiredComponents.length > 0 
    ? Math.round((filledRequiredComponents.length / requiredComponents.length) * 100) 
    : 100;
  
  const isComplete = requiredComponents.length > 0 
    ? filledRequiredComponents.length === requiredComponents.length
    : true;
  
  return { completionPercentage, isComplete };
}
