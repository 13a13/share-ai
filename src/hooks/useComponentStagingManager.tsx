
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ComponentStagingData } from "@/types";

export function useComponentStagingManager() {
  const { toast } = useToast();
  const [componentStaging, setComponentStaging] = useState<Map<string, ComponentStagingData>>(new Map());
  const [globalProcessing, setGlobalProcessing] = useState(false);

  const addStagedImages = useCallback((componentId: string, componentName: string, images: string[]) => {
    setComponentStaging(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(componentId) || { 
        componentId, 
        componentName, 
        stagedImages: [], 
        isProcessing: false,
        timestamp: new Date()
      };
      newMap.set(componentId, {
        ...existing,
        stagedImages: [...existing.stagedImages, ...images],
        timestamp: new Date()
      });
      return newMap;
    });
  }, []);

  const removeStagedImage = useCallback((componentId: string, imageIndex: number) => {
    setComponentStaging(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(componentId);
      if (existing) {
        newMap.set(componentId, {
          ...existing,
          stagedImages: existing.stagedImages.filter((_, i) => i !== imageIndex),
          timestamp: new Date()
        });
      }
      return newMap;
    });
  }, []);

  const clearComponentStaging = useCallback((componentId: string) => {
    setComponentStaging(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
  }, []);

  const setComponentProcessing = useCallback((componentId: string, isProcessing: boolean) => {
    setComponentStaging(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(componentId);
      if (existing) {
        newMap.set(componentId, { 
          ...existing, 
          isProcessing,
          timestamp: new Date()
        });
      }
      return newMap;
    });
  }, []);

  const getTotalStagedImages = useCallback(() => {
    return Array.from(componentStaging.values()).reduce((total, comp) => total + comp.stagedImages.length, 0);
  }, [componentStaging]);

  const getComponentsWithStagedImages = useCallback(() => {
    return Array.from(componentStaging.values()).filter(comp => comp.stagedImages.length > 0);
  }, [componentStaging]);

  return {
    componentStaging,
    globalProcessing,
    setGlobalProcessing,
    addStagedImages,
    removeStagedImage,
    clearComponentStaging,
    setComponentProcessing,
    getTotalStagedImages,
    getComponentsWithStagedImages
  };
}
