
import { RoomType, RoomComponent } from "@/types";
import ComponentList from "./room/ComponentList";
import { useRoomComponents } from "@/hooks/useRoomComponents";

interface RoomComponentInspectionProps {
  reportId: string;
  roomId: string;
  roomType: RoomType;
  propertyName?: string;
  roomName?: string;
  components: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
  onSaveComponent?: (componentId: string) => Promise<void>;
}

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType,
  propertyName,
  roomName,
  components, 
  onChange,
  onSaveComponent
}: RoomComponentInspectionProps) => {
  console.log(`🔧 RoomComponentInspection: propertyName="${propertyName}", roomName="${roomName}"`);
  
  // Use the custom hook to manage all room component state and logic
  const {
    components: roomComponents,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
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
  } = useRoomComponents({
    roomId,
    roomType,
    propertyName,
    roomName,
    initialComponents: components,
    onChange,
    onSaveComponent,
    reportId
  });

  // Wrapper function to match expected signature
  const handleAddStagedImages = (componentId: string, images: string[]) => {
    const component = roomComponents.find(c => c.id === componentId);
    const componentName = component?.name || 'Unknown Component';
    addStagedImages(componentId, componentName, images);
  };

  return (
    <ComponentList
      roomType={roomType}
      propertyName={propertyName}
      roomName={roomName}
      components={roomComponents}
      isProcessing={isProcessing}
      expandedComponents={expandedComponents}
      selectedComponentType={selectedComponentType}
      // Remove availableComponents prop - calculated internally
      onSelectedComponentTypeChange={setSelectedComponentType}
      onAddComponent={handleAddComponent}
      onAddCustomComponent={addCustomComponent}
      onToggleExpand={toggleExpandComponent}
      onRemoveComponent={handleRemoveComponent}
      onToggleEditMode={toggleEditMode}
      onUpdateComponent={handleUpdateComponent}
      onRemoveImage={handleRemoveImage}
      onImagesProcessed={handleImagesProcessed}
      onProcessingStateChange={handleComponentProcessingState}
      componentStaging={Array.from(componentStaging.values())}
      analysisProgress={analysisProgress.get('global') || { status: 'pending', progress: 0 }}
      stagingProcessing={{}} // Convert boolean to object
      onAnalyzeAll={handleAnalyzeAll}
      onClearAllStaging={handleClearAllStaging}
      onAddStagedImages={handleAddStagedImages}
      onRemoveStagedImage={removeStagedImage}
      onProcessStagedComponent={handleProcessStagedComponent}
      onClearComponentStaging={clearComponentStaging}
      onSaveComponent={handleSaveComponent}
    />
  );
};

export default RoomComponentInspection;
