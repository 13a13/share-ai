
import { useState } from "react";

export function useComponentExpansion() {
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);

  const toggleExpandComponent = (componentId: string) => {
    setExpandedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId) 
        : [...prev, componentId]
    );
  };

  return {
    expandedComponents,
    setExpandedComponents,
    toggleExpandComponent
  };
}
