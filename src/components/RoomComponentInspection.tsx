
import { RoomType, RoomComponent } from "@/types";
import ComponentList from "./room/ComponentList";
import { useRoomComponents } from "@/hooks/useRoomComponents";

interface RoomComponentInspectionProps {
  reportId: string;
  roomId: string;
  roomType: RoomType;
  components: RoomComponent[];
  onChange: (updatedComponents: RoomComponent[]) => void;
}

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType, 
  components, 
  onChange 
}: RoomComponentInspectionProps) => {
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
    initialComponents: components,
    onChange
  });

  return (
    <ComponentList
      roomType={roomType}
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
