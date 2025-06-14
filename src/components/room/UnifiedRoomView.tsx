
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
  onNavigateRoom: (direction: 'prev' | 'next') => void;
  onUpdateGeneralCondition: (roomId: string, condition: string, summary: string) => void;
  onUpdateComponents: (roomId: string, components: any[]) => void;
  onDeleteRoom: (roomId: string) => void;
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
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" data-room-id={room.id}>
      <RoomHeader
        room={room}
        roomIndex={roomIndex}
        totalRooms={totalRooms}
        isComplete={isComplete}
        onNavigateRoom={onNavigateRoom}
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
