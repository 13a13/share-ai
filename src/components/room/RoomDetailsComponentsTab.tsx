
import { Room, RoomComponent } from "@/types";
import RoomComponentInspection from "@/components/RoomComponentInspection";
import { useDebouncedComponentSave } from "@/hooks/useDebouncedComponentSave";

interface RoomDetailsComponentsTabProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
}

const RoomDetailsComponentsTab = ({
  reportId,
  room,
  propertyName,
  onUpdateComponents
}: RoomDetailsComponentsTabProps) => {
  console.log(`🏗️ RoomDetailsComponentsTab: propertyName="${propertyName}", roomName="${room.name}"`);
  
  // Set up debounced saving for real-time updates
  const { debouncedSave, saveImmediately } = useDebouncedComponentSave({
    onSave: onUpdateComponents,
    delay: 2000 // 2 second delay for auto-save
  });
  
  const handleComponentUpdate = (updatedComponents: RoomComponent[]) => {
    // Use debounced save for real-time updates (typing, selecting options)
    debouncedSave(room.id, updatedComponents);
  };

  const handleComponentSave = async (componentId: string) => {
    // Use immediate save when user explicitly clicks "Save"
    const currentComponents = room.components || [];
    await saveImmediately(room.id, currentComponents);
  };

  return (
    <RoomComponentInspection
      reportId={reportId}
      roomId={room.id}
      roomType={room.type}
      propertyName={propertyName}
      roomName={room.name}
      components={(room.components || []).map(comp => ({
        ...comp,
        notes: comp.notes,
      }))}
      onChange={handleComponentUpdate}
      onSaveComponent={handleComponentSave}
    />
  );
};

export default RoomDetailsComponentsTab;
