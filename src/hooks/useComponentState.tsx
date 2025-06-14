
import { useState } from "react";
import { RoomComponent } from "@/types";

interface UseComponentStateProps {
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

interface UseComponentStateReturn {
  components: RoomComponent[];
  setComponents: React.Dispatch<React.SetStateAction<RoomComponent[]>>;
  updateComponents: (updatedComponents: RoomComponent[]) => void;
  isProcessing: { [key: string]: boolean };
  setProcessingState: (componentId: string, isProcessing: boolean) => void;
}

export function useComponentState(
  initialComponents: RoomComponent[],
  onChange: (updatedComponents: RoomComponent[]) => void
): UseComponentStateReturn {
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});

  const updateComponents = (updatedComponents: RoomComponent[]) => {
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const setProcessingState = (componentId: string, isProcessing: boolean) => {
    setIsProcessing(prev => ({
      ...prev,
      [componentId]: isProcessing
    }));
  };

  return {
    components,
    setComponents,
    updateComponents,
    isProcessing,
    setProcessingState
  };
}
