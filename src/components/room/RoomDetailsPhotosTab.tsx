
import { Badge } from "@/components/ui/badge";
import { Room } from "@/types";
import RoomImageUploader from "@/components/RoomImageUploader";
import SignedImage from "@/components/common/SignedImage";
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
  console.log(`📸 RoomDetailsPhotosTab: propertyName="${propertyName}", roomName="${room.name}"`);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Room Photos</h3>
      
      {room.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {room.images.map((image) => (
            <div key={image.id} className="relative rounded-lg overflow-hidden border">
              <SignedImage 
                src={image.url} 
                alt={`${room.name}`} 
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className={image.aiProcessed ? "bg-green-500" : "bg-yellow-500"}>
                  {image.aiProcessed ? "AI Processed" : "Not Processed"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
      
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
