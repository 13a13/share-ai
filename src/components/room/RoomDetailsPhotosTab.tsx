
import RoomImageUploader from "../RoomImageUploader";
import { Room } from "@/types";

interface RoomDetailsPhotosTabProps {
  reportId: string;
  room: Room;
  propertyName?: string;
  onImageProcessed: (updatedRoom: Room) => void;
}

const RoomDetailsPhotosTab = ({
  reportId,
  room,
  propertyName,
  onImageProcessed
}: RoomDetailsPhotosTabProps) => {
  
  console.log(`📸 RoomDetailsPhotosTab for room "${room.name}" in property "${propertyName}"`);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Room Photos</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload general photos of this room. These will be stored in: {propertyName || 'unknown_property'}/{room.name || 'unknown_room'}/room_photos
      </p>
      
      <RoomImageUploader
        reportId={reportId}
        roomId={room.id}
        propertyName={propertyName}
        roomName={room.name}
        onImageProcessed={onImageProcessed}
      />
    </div>
  );
};

export default RoomDetailsPhotosTab;
