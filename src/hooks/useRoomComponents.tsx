
import { RoomComponent, ComponentStagingData, BatchAnalysisProgress } from "@/types";
import { ROOM_COMPONENT_CONFIGS } from "@/utils/roomComponentUtils";
import { useComponentState } from "./useComponentState";
import { useComponentOperations } from "./useComponentOperations";
import { useComponentImageHandling } from "./useComponentImageHandling";
import { useComponentStagingManager } from "./useComponentStagingManager";
import { useEnhancedBatchAnalysis } from "./useEnhancedBatchAnalysis";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRoomComponentsProps {
  roomId: string;
  roomType: string;
  propertyName?: string;
  roomName?: string;
  initialComponents: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
  onSaveComponent?: (componentId: string) => Promise<void>;
  reportId: string;
}

interface ComponentConfig {
  name: string;
  type: string;
  isOptional?: boolean;
}

interface UseRoomComponentsReturn {
  components: RoomComponent[];
  isProcessing: { [key: string]: boolean };
  expandedComponents: string[];
  selectedComponentType: string;
  availableComponents: ComponentConfig[];
  propertyName?: string;
  roomName?: string;
  setSelectedComponentType: React.Dispatch<React.SetStateAction<string>>;
  handleAddComponent: () => void;
  addCustomComponent: (name: string) => void;
  handleRemoveComponent: (componentId: string) => void;
  handleUpdateComponent: (componentId: string, updates: Partial<RoomComponent>) => void;
  handleSaveComponent: (componentId: string) => Promise<void>;
  toggleEditMode: (componentId: string) => void;
  handleRemoveImage: (componentId: string, imageId: string) => void;
  handleImagesProcessed: (componentId: string, imageUrls: string[], result: any) => void;
  handleComponentProcessingState: (componentId: string, isProcessing: boolean) => void;
  toggleExpandComponent: (componentId: string) => void;
  
  // New staging and batch analysis returns
  componentStaging: Map<string, ComponentStagingData>;
  analysisProgress: Map<string, BatchAnalysisProgress>;
  globalProcessing: boolean;
  addStagedImages: (componentId: string, componentName: string, images: string[]) => void;
  removeStagedImage: (componentId: string, imageIndex: number) => void;
  clearComponentStaging: (componentId: string) => void;
  handleAnalyzeAll: () => Promise<void>;
  handleProcessStagedComponent: (componentId: string) => Promise<void>;
  handleClearAllStaging: () => void;
  getTotalStagedImages: () => number;
  getComponentsWithStagedImages: () => ComponentStagingData[];
}

export function useRoomComponents({
  roomId,
  roomType,
  propertyName: initialPropertyName,
  roomName: initialRoomName,
  initialComponents,
  onChange,
  onSaveComponent,
  reportId
}: UseRoomComponentsProps): UseRoomComponentsReturn {
  const [propertyName, setPropertyName] = useState(initialPropertyName ?? "");
  const [roomName, setRoomName] = useState(initialRoomName ?? "");

  useEffect(() => {
    async function fetchNamesIfNeeded() {
      if ((!propertyName || propertyName === "unknown_property" || propertyName.trim() === "") && roomId && supabase) {
        const { data, error } = await supabase
          .from('rooms')
          .select('id, name, property_id, properties(name)')
          .eq('id', roomId)
          .maybeSingle();
        if (data && !error) {
          setRoomName((data as any).name ?? "");
          setPropertyName((data as any).properties?.name ?? "");
        }
      }
    }
    fetchNamesIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, propertyName, roomName]);

  // Get available components for the room type
  const availableComponents = ROOM_COMPONENT_CONFIGS[roomType as keyof typeof ROOM_COMPONENT_CONFIGS] || [];

  // Component state management
  const {
    components,
    updateComponents,
    isProcessing,
    expandedComponents,
    setExpandedComponents,
    selectedComponentType,
    setSelectedComponentType,
    handleComponentProcessingState,
    toggleExpandComponent
  } = useComponentState({
    initialComponents,
    onChange
  });

  // Component CRUD operations
  const {
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode
  } = useComponentOperations({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    availableComponents,
    selectedComponentType,
    setSelectedComponentType
  });

  // Image handling operations: pass roomId for context
  const {
    handleRemoveImage,
    handleImagesProcessed
  } = useComponentImageHandling({
    components,
    updateComponents,
    expandedComponents,
    setExpandedComponents,
    onChange,
    propertyName,
    roomName,
    roomId,
    reportId
  });

  // Add staging manager
  const {
    componentStaging,
    globalProcessing: stagingGlobalProcessing,
    setGlobalProcessing,
    addStagedImages,
    removeStagedImage,
    clearComponentStaging,
    setComponentProcessing,
    getTotalStagedImages,
    getComponentsWithStagedImages
  } = useComponentStagingManager();

  // Add enhanced batch analysis manager
  const {
    analysisProgress,
    globalProcessing: batchGlobalProcessing,
    processComponentBatch,
    processBatchParallel,
    resetProgress
  } = useEnhancedBatchAnalysis({
    reportId: roomId, // This needs to be the actual reportId
    roomId,
    roomType,
    propertyName,
    roomName,
    enableCrossValidation: true
  });

  // Update globalProcessing state
  const globalProcessing = batchGlobalProcessing || stagingGlobalProcessing;

  // Add batch analysis functions
  const handleAnalyzeAll = useCallback(async () => {
    const componentsToAnalyze = getComponentsWithStagedImages();
    if (componentsToAnalyze.length === 0) return;

    setGlobalProcessing(true);
    try {
      await processBatchParallel(componentsToAnalyze);
      
      // Clear staging after successful analysis
      componentsToAnalyze.forEach(comp => clearComponentStaging(comp.componentId));
    } catch (error) {
      console.error("❌ Batch analysis failed:", error);
    } finally {
      setGlobalProcessing(false);
    }
  }, [getComponentsWithStagedImages, processBatchParallel, setGlobalProcessing, clearComponentStaging]);

  const handleProcessStagedComponent = useCallback(async (componentId: string) => {
    const stagingData = componentStaging.get(componentId);
    if (!stagingData || stagingData.stagedImages.length === 0) return;

    setComponentProcessing(componentId, true);
    try {
      await processComponentBatch(stagingData);
      clearComponentStaging(componentId);
    } catch (error) {
      console.error(`❌ Component analysis failed for ${componentId}:`, error);
    } finally {
      setComponentProcessing(componentId, false);
    }
  }, [componentStaging, processComponentBatch, clearComponentStaging, setComponentProcessing]);

  const handleClearAllStaging = useCallback(() => {
    componentStaging.forEach((_, componentId) => clearComponentStaging(componentId));
    resetProgress();
  }, [componentStaging, clearComponentStaging, resetProgress]);

  // Handle explicit component save
  const handleSaveComponent = useCallback(async (componentId: string) => {
    console.log(`💾 useRoomComponents: handleSaveComponent called for component ${componentId}`);
    
    if (onSaveComponent) {
      console.log(`💾 useRoomComponents: Calling explicit onSaveComponent for ${componentId}`);
      try {
        await onSaveComponent(componentId);
        console.log(`✅ useRoomComponents: Explicit save completed for component ${componentId}`);
      } catch (error) {
        console.error(`❌ useRoomComponents: Explicit save failed for component ${componentId}:`, error);
        throw error;
      }
    } else {
      console.log(`⚠️ useRoomComponents: No onSaveComponent handler available for ${componentId}`);
    }
  }, [onSaveComponent]);

  return {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    propertyName,
    roomName,
    setSelectedComponentType,
    handleAddComponent,
    addCustomComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    handleSaveComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed,
    handleComponentProcessingState,
    toggleExpandComponent,
    
    // New staging and batch analysis returns
    componentStaging,
    analysisProgress,
    globalProcessing,
    addStagedImages,
    removeStagedImage,
    clearComponentStaging,
    handleAnalyzeAll,
    handleProcessStagedComponent,
    handleClearAllStaging,
    getTotalStagedImages,
    getComponentsWithStagedImages
  };
}
