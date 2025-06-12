
import { useState, useRef } from "react";
import { RoomComponent } from "@/types";

interface UseComponentStateProps {
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useComponentState({
  initialComponents,
  onChange
}: UseComponentStateProps) {
  const [components, setComponents] = useState<RoomComponent[]>(initialComponents);
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState("");
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
