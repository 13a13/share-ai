
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
}

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType, 
  propertyName,
  roomName,
  components, 
  onChange 
}: RoomComponentInspectionProps) => {
  
  console.log(`🔧 RoomComponentInspection for room "${roomName}" in property "${propertyName}"`);
  
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
    toggleEditMode,
    handleRemoveImage,
    handleImagesProcessed,
    handleComponentProcessingState,
    toggleExpandComponent
  } = useRoomComponents({
    roomId,
    roomType,
    propertyName,
    roomName,
    initialComponents: components,
    onChange
  });

  return (
    <ComponentList
      roomType={roomType}
      propertyName={propertyName}
      roomName={roomName}
      components={roomComponents}
      isProcessing={isProcessing}
      expandedComponents={expandedComponents}
      selectedComponentType={selectedComponentType}
      availableComponents={availableComponents}
      onSelectComponent={setSelectedComponentType}
      onAddComponent={handleAddComponent}
      onAddCustomComponent={addCustomComponent}
      onToggleExpand={toggleExpandComponent}
      onRemoveComponent={handleRemoveComponent}
      onToggleEditMode={toggleEditMode}
      onUpdateComponent={handleUpdateComponent}
      onRemoveImage={handleRemoveImage}
      onImageProcessed={handleImagesProcessed}
      onProcessingStateChange={handleComponentProcessingState}
    />
  );
};

export default RoomComponentInspection;
