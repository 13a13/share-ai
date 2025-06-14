
import { useState } from "react";
import { RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

interface UseComponentSelectionProps {
  roomType: RoomType;
  components: Array<{ type: string }>;
}

export function useComponentSelection({ roomType, components }: UseComponentSelectionProps) {
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");

  const availableComponents = getDefaultComponentsByRoomType(roomType).filter(
    comp => !components.some(c => c.type === comp.type)
  );

  return {
    selectedComponentType,
    setSelectedComponentType,
    availableComponents
  };
}
