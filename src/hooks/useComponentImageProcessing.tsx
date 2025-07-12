
import { useState, useRef } from "react";
import { RoomComponent, RoomComponentImage } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { ReportsAPI } from "@/lib/api";

interface UseComponentImageProcessingProps {
  components: RoomComponent[];
  expandedComponents: string[];
  setComponents: (updatedComponents: RoomComponent[]) => void;
  setExpandedComponents: (ids: string[]) => void;
  onChange: (updatedComponents: RoomComponent[]) => void;
}

/**
 * Helper function to convert condition points into readable summary text
 */
const convertConditionPointsToSummary = (points: any[]): string => {
  if (!points || points.length === 0) {
    return 'Assessment completed';
  }

  // Convert points to readable text
  const pointTexts = points.map(point => {
    if (typeof point === 'string') {
      return point;
    } else if (typeof point === 'object' && point !== null) {
      return point.label || '';
    }
    return '';
  }).filter(Boolean);

  if (pointTexts.length === 0) {
    return 'Assessment completed';
  }

  // Join points into a coherent summary
  if (pointTexts.length === 1) {
    return pointTexts[0];
  } else if (pointTexts.length === 2) {
    return `${pointTexts[0]} and ${pointTexts[1]}`;
  } else {
    const lastPoint = pointTexts.pop();
    return `${pointTexts.join(', ')}, and ${lastPoint}`;
  }
};

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
    
    const currentTimestamp = new Date(); // Create a Date object
    
    const newImages: RoomComponentImage[] = imageUrls.map(url => ({
      id: uuidv4(),
      url,
      timestamp: currentTimestamp,
      aiProcessed: true,
      aiData: result
    }));
    
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        // Make sure we don't exceed max images (20)
        const currentImages = [...comp.images];
        const combinedImages = [...currentImages, ...newImages];
        const finalImages = combinedImages.slice(0, 20);
        
        // Convert condition points to readable summary for the editable field
        const detailedSummary = result.condition?.points 
          ? convertConditionPointsToSummary(result.condition.points)
          : result.condition?.summary || comp.conditionSummary;
        
        // Create updated component with all the analysis data - DO NOT auto-enable edit mode
        const updatedComponent = {
          ...comp,
          images: finalImages,
          description: result.description || comp.description,
          conditionSummary: detailedSummary, // AI analysis goes into conditionSummary field
          conditionPoints: result.condition?.points || comp.conditionPoints || [],
          condition: result.condition?.rating || comp.condition,
          cleanliness: result.cleanliness || comp.cleanliness,
          notes: result.notes || comp.notes,
          // REMOVED: isEditing: true - Keep component in view mode to show analysis immediately
        };
        
        // Try to save the component analysis to database as well
        try {
          // We need to get reportId and roomId from the DOM or context
          const reportElement = document.querySelector('[data-report-id]');
          const roomElement = document.querySelector('[data-room-id]');
          
          if (reportElement && roomElement) {
            const reportId = reportElement.getAttribute('data-report-id');
            const roomId = roomElement.getAttribute('data-room-id');
            
            if (reportId && roomId) {
              // Call the new method to save component analysis
              ReportsAPI.updateComponentAnalysis(
                reportId,
                roomId,
                componentId,
                result,
                imageUrls
              );
            }
          }
        } catch (err) {
          console.error("Failed to save component analysis:", err);
        }
        
        return updatedComponent;
      }
      return comp;
    });
    
    setComponents(updatedComponents);
    onChange(updatedComponents);
    
    // Ensure the component is expanded to show analysis results
    if (!expandedComponents.includes(componentId)) {
      setExpandedComponents([...expandedComponents, componentId]);
    }
    
    // Scroll to the component element and add highlight effect
    setTimeout(() => {
      const element = document.getElementById(`component-${componentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect to draw attention
        element.classList.add('highlight-component');
        setTimeout(() => {
          element.classList.remove('highlight-component');
        }, 3000);
      }
    }, 300);
    
    toast({
      title: "AI Analysis Complete",
      description: "Detailed findings are now visible in the component assessment.",
    });
  };
  
  return {
    handleImagesProcessed
  };
}
