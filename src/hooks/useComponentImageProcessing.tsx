
import { ConditionRating, RoomComponent } from "@/types";

interface UseComponentImageProcessingProps {
  components: RoomComponent[];
  expandedComponents: string[];
  setComponents: (components: RoomComponent[]) => void;
  setExpandedComponents: (ids: string[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
}

export function useComponentImageProcessing({
  components,
  expandedComponents,
  setComponents,
  setExpandedComponents,
  onChange
}: UseComponentImageProcessingProps) {
  const handleImagesProcessed = (
    componentId: string, 
    imageUrls: string[], 
    result: { 
      description?: string; 
      condition?: {
        summary?: string;
        rating?: ConditionRating;
      }; 
      notes?: string;
    }
  ) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        // Create new image objects for all uploaded images
        const newImages = imageUrls.map(url => ({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: url,
          timestamp: new Date(),
        }));
        
        return {
          ...comp,
          description: result.description || comp.description,
          condition: result.condition?.rating || comp.condition,
          conditionSummary: result.condition?.summary || comp.conditionSummary,
          notes: result.notes ? (comp.notes ? `${comp.notes}\n\n${result.notes}` : result.notes) : comp.notes,
          images: [...comp.images, ...newImages],
          isEditing: true
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    if (!expandedComponents.includes(componentId)) {
      setExpandedComponents([...expandedComponents, componentId]);
    }
  };

  return {
    handleImagesProcessed
  };
}
