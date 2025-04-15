
import { useState, useRef } from "react";
import { RoomComponent, RoomComponentImage } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  
  const handleImagesProcessed = (componentId: string, imageUrls: string[], result: any) => {
    if (!imageUrls.length) return;
    
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    const newImages: RoomComponentImage[] = imageUrls.map(url => ({
      id: uuidv4(),
      url,
      timestamp: new Date().toISOString() // Store current timestamp for "last analyzed"
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
          isEditing: true // Automatically open edit mode after analysis
        };
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    // Ensure the component is expanded to show analysis results
    if (!expandedComponents.includes(componentId)) {
      setExpandedComponents([...expandedComponents, componentId]);
    }
    
    // Scroll to the component element
    setTimeout(() => {
      const element = document.getElementById(`component-${componentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.classList.add('highlight-component');
        setTimeout(() => {
          element.classList.remove('highlight-component');
        }, 3000);
      }
    }, 300);
    
    toast({
      title: "AI Analysis Complete",
      description: "The component has been analyzed and details are now available for editing.",
    });
  };
  
  return {
    handleImagesProcessed
  };
}
