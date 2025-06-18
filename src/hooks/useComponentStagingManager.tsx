
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ComponentStagingState {
  componentId: string;
  componentName: string;
  stagedImages: string[];
  isProcessing: boolean;
}

export function useComponentStagingManager() {
  const { toast } = useToast();
  const [componentStaging, setComponentStaging] = useState<Map<string, ComponentStagingState>>(new Map());
  const [globalProcessing, setGlobalProcessing] = useState(false);

  const addStagedImages = useCallback((componentId: string, componentName: string, images: string[]) => {
    setComponentStaging(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(componentId) || { componentId, componentName, stagedImages: [], isProcessing: false };
      newMap.set(componentId, {
        ...existing,
        stagedImages: [...existing.stagedImages, ...images]
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
          stagedImages: existing.stagedImages.filter((_, i) => i !== imageIndex)
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
        newMap.set(componentId, { ...existing, isProcessing });
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
