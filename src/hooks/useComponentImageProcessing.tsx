
import { useState } from "react";
import { RoomComponent, RoomComponentImage } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseComponentImageProcessingProps {
  components: RoomComponent[];
  expandedComponents: string[];
  setComponents: (updatedComponents: RoomComponent[]) => void;
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
  const handleImagesProcessed = (componentId: string, imageUrls: string[], result: any) => {
    if (!imageUrls.length) return;
    
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    const newImages: RoomComponentImage[] = imageUrls.map(url => ({
      id: uuidv4(),
      url,
      timestamp: new Date()
    }));
    
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        // Make sure we don't exceed max images (20)
        const currentImages = [...comp.images];
        const combinedImages = [...currentImages, ...newImages];
        const finalImages = combinedImages.slice(0, 20);
        
        return {
          ...comp,
          images: finalImages,
          description: result.description || comp.description,
          conditionSummary: result.condition?.summary || comp.conditionSummary,
          conditionPoints: result.condition?.points || comp.conditionPoints || [],
          condition: result.condition?.rating || comp.condition,
          cleanliness: result.cleanliness || comp.cleanliness,
          notes: result.notes || comp.notes,
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
