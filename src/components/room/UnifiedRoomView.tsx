
import { useState } from "react";
import { Room } from "@/types";
import RoomHeader from "./RoomHeader";
import RoomContent from "./RoomContent";

interface UnifiedRoomViewProps {
  reportId: string;
  room: Room;
  roomIndex: number;
  totalRooms: number;
  propertyName?: string;
  onNavigateRoom: (index: number) => void;
  onUpdateGeneralCondition: (roomId: string, condition: string, summary: string) => void;
  onUpdateComponents: (roomId: string, components: any[]) => void;
  onDeleteRoom: () => void;
  isComplete: boolean;
}

const UnifiedRoomView = ({
  reportId,
  room,
  roomIndex,
  totalRooms,
  propertyName,
  onNavigateRoom,
  onUpdateGeneralCondition,
  onUpdateComponents,
  onDeleteRoom,
  isComplete
}: UnifiedRoomViewProps) => {
  console.log(`🏠 UnifiedRoomView rendering for room "${room.name}" in property "${propertyName}"`);
  
  const handleNavigateRoom = (index: number) => {
    onNavigateRoom(index);
  };
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" data-room-id={room.id}>
      <RoomHeader
        room={room}
        roomIndex={roomIndex}
        totalRooms={totalRooms}
        isComplete={isComplete}
        onNavigateRoom={handleNavigateRoom}
        onDeleteRoom={onDeleteRoom}
      />
      
      <RoomContent
        reportId={reportId}
        room={room}
        propertyName={propertyName}
        onUpdateGeneralCondition={onUpdateGeneralCondition}
        onUpdateComponents={onUpdateComponents}
      />
    </div>
  );
};

export default UnifiedRoomView;
