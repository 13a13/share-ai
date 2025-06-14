
import { useState } from "react";
import { RoomType } from "@/types";
import { getDefaultComponentsByRoomType } from "@/utils/roomComponentUtils";

interface UseComponentSelectionReturn {
  selectedComponentType: string;
  availableComponents: { name: string; type: string; isOptional: boolean }[];
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
}

export function useComponentSelection(roomType: RoomType): UseComponentSelectionReturn {
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");
  
  const availableComponents = getDefaultComponentsByRoomType(roomType);

  return {
    selectedComponentType,
    availableComponents,
    setSelectedComponentType
  };
}
