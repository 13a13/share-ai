
import { useState } from "react";
import { RoomType, RoomComponent } from "@/types";
import ComponentSelector from "./room/ComponentSelector";
import ComponentList from "./room/ComponentList";
import { useRoomComponents, ComponentItem } from "@/hooks/useRoomComponents";

interface RoomComponentInspectionProps {
  reportId: string;
  roomId: string;
  roomType: RoomType;
  components: ComponentItem[];
  onChange: (updatedComponents: ComponentItem[]) => void;
}

const RoomComponentInspection = ({ 
  reportId, 
  roomId, 
  roomType, 
  components, 
  onChange 
}: RoomComponentInspectionProps) => {
  const [expandedComponents, setExpandedComponents] = useState<string[]>([]);
  
  const {
    addComponent,
    removeComponent,
    updateComponent,
    toggleEditMode,
    removeImage,
    handleImageProcessed
  } = useRoomComponents(components, roomType, onChange);

  const handleAddComponent = (componentType: string) => {
    const newComponentId = addComponent(componentType);
    if (newComponentId) {
      setExpandedComponents([...expandedComponents, newComponentId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">Room Components</h3>
        <ComponentSelector 
          roomType={roomType}
          existingComponents={components}
          onAddComponent={handleAddComponent}
        />
      </div>
      
      <ComponentList 
        components={components}
        roomType={roomType}
        onEmptyAddComponent={() => handleAddComponent("")}
        onRemoveComponent={removeComponent}
        onToggleEditMode={toggleEditMode}
        onUpdateComponent={updateComponent}
        onRemoveImage={removeImage}
        onImageProcessed={handleImageProcessed}
      />
    </div>
  );
};

export default RoomComponentInspection;
