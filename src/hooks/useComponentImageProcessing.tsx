
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
        points?: string[];
        rating?: ConditionRating;
      }; 
      cleanliness?: string;
      rating?: string;
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
        
        // Map the condition rating from inventory to standard format if needed
        let conditionValue = comp.condition;
        if (result.condition?.rating) {
          conditionValue = result.condition.rating;
        } else if (result.rating) {
          // Map inventory ratings to system ratings
          switch (result.rating.toLowerCase()) {
            case 'good order':
              conditionValue = 'excellent';
              break;
            case 'used order':
              conditionValue = 'good';
              break;
            case 'fair order':
              conditionValue = 'fair';
              break;
            case 'damaged':
              conditionValue = 'poor';
              break;
            default:
              conditionValue = comp.condition;
          }
        }
        
        // Parse and convert cleanliness value if needed
        let cleanlinessValue = result.cleanliness || comp.cleanliness;
        if (cleanlinessValue) {
          // Convert from "Professional Clean" format to "professional_clean" format
          cleanlinessValue = cleanlinessValue
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        }
        
        // Ensure points are properly formatted
        const conditionPoints = result.condition?.points || [];
        
        return {
          ...comp,
          description: result.description || comp.description,
          condition: conditionValue,
          conditionSummary: result.condition?.summary || comp.conditionSummary,
          conditionPoints: conditionPoints,
          cleanliness: cleanlinessValue,
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
