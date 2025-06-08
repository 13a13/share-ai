
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Room, RoomSection, RoomComponent } from "@/types";
import { useOptimizedBatchSaving } from "@/hooks/useOptimizedBatchSaving";
import RoomDetailsHeader from "./room/RoomDetailsHeader";
import RoomDetailsContent from "./room/RoomDetailsContent";
import RoomDetailsEmptyState from "./room/RoomDetailsEmptyState";

interface RoomDetailsProps {
  reportId: string;
  room: Room | null;
  allRooms: Room[];
  currentRoomIndex: number;
  onChangeRoom: (index: number) => void;
  onUpdateGeneralCondition: (roomId: string, condition: string) => Promise<void>;
  onSaveSection: (updatedSection: RoomSection) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onImageProcessed: (updatedRoom: Room) => void;
}

const RoomDetails = ({
  reportId,
  room,
  allRooms,
  currentRoomIndex,
  onChangeRoom,
  onUpdateGeneralCondition,
  onSaveSection,
  onUpdateComponents,
  onImageProcessed
}: RoomDetailsProps) => {
  const { forceSave, isSaving, getPendingCount } = useOptimizedBatchSaving();

  if (!room) {
    return <RoomDetailsEmptyState />;
  }

  const roomsWithContent = allRooms.filter(r => 
    r.components?.some(c => c.description && c.condition) || 
    r.generalCondition
  ).length;
  const overallProgress = Math.round((roomsWithContent / allRooms.length) * 100);

  const requiredComponents = room.components?.filter(c => !c.isOptional) || [];
  const filledRequiredComponents = requiredComponents.filter(c => 
    c.description && c.condition && (c.images.length > 0 || c.notes)
  );
  const roomCompletionPercentage = requiredComponents.length > 0 
    ? Math.round((filledRequiredComponents.length / requiredComponents.length) * 100) 
    : 100;

  const handleForceSave = async () => {
    await forceSave(reportId);
  };

  const pendingCount = getPendingCount();

  return (
    <Card className="transition-none" data-report-id={reportId} data-room-id={room.id}>
      <CardHeader>
        <RoomDetailsHeader
          roomName={room.name}
          reportId={reportId}
          roomId={room.id}
          pendingCount={pendingCount}
          isSaving={isSaving}
          roomCompletionPercentage={roomCompletionPercentage}
          overallProgress={overallProgress}
          onForceSave={handleForceSave}
        />
      </CardHeader>
      <CardContent>
        <RoomDetailsContent
          reportId={reportId}
          room={room}
          onUpdateGeneralCondition={onUpdateGeneralCondition}
          onSaveSection={onSaveSection}
          onUpdateComponents={onUpdateComponents}
          onImageProcessed={onImageProcessed}
        />
      </CardContent>
    </Card>
  );
};

export default RoomDetails;
