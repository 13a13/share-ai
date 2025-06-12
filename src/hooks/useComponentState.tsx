
import { useState, useRef } from "react";
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
  expandedComponents: string[];
  setExpandedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  selectedComponentType: string;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
  componentRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  handleComponentProcessingState: (componentId: string, isProcessing: boolean) => void;
  toggleExpandComponent: (componentId: string) => void;
}

export function useComponentState({
  initialComponents,
  onChange
}: UseComponentStateProps): UseComponentStateReturn {
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<string>("");
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const updateComponents = (updatedComponents: RoomComponent[]) => {
    setComponents(updatedComponents);
    onChange(updatedComponents);
  };

  const handleComponentProcessingState = (componentId: string, isProcessing: boolean) => {
    setIsProcessing(prev => ({
      ...prev,
      [componentId]: isProcessing
    }));
  };

  const toggleExpandComponent = (componentId: string) => {
    setExpandedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  return {
    components,
    setComponents,
    updateComponents,
    isProcessing,
    expandedComponents,
    setExpandedComponents,
    selectedComponentType,
    setSelectedComponentType,
    componentRefs,
    handleComponentProcessingState,
    toggleExpandComponent
  };
}
