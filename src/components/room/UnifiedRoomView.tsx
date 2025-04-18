
import { useState, useRef, useEffect } from "react";
import { Room, RoomComponent } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import RoomHeader from "./RoomHeader";
import RoomContent from "./RoomContent";
import { calculateRoomCompletion } from "@/utils/roomCompletionUtils";

interface UnifiedRoomViewProps {
  reportId: string;
  room: Room;
  roomIndex: number;
  totalRooms: number;
  onNavigateRoom: (index: number) => void;
  onUpdateGeneralCondition: (roomId: string, generalCondition: string) => Promise<void>;
  onUpdateComponents: (roomId: string, updatedComponents: RoomComponent[]) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isComplete?: boolean;
}

const UnifiedRoomView = ({ 
  reportId, 
  room, 
  roomIndex,
  totalRooms,
  onNavigateRoom,
  onUpdateGeneralCondition,
  onUpdateComponents,
  onDeleteRoom,
  isComplete: externalComplete = false
}: UnifiedRoomViewProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showLed, setShowLed] = useState(true);
  
  // Calculate room completion
  const { completionPercentage, isComplete: calculatedComplete } = calculateRoomCompletion(room);
  const isComplete = externalComplete || calculatedComplete;
  
  useEffect(() => {
    // Auto-scroll to this room if it's incomplete and marked for attention
    if (!isComplete && isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isExpanded, isComplete]);

  useEffect(() => {
    // Hide LED indicator after 5 seconds
    if (showLed) {
      const timer = setTimeout(() => setShowLed(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showLed]);
  
  const handleDeleteRoom = async () => {
    if (window.confirm(`Are you sure you want to delete ${room.name}?`)) {
      try {
        await onDeleteRoom(room.id);
        toast({
          title: "Room Deleted",
          description: `${room.name} has been deleted from the report.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete room. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only toggle expansion if we're clicking the card header directly
    // and not any of its children components that might have their own click handlers
    if (e.currentTarget === e.target || 
        (e.target as HTMLElement).classList.contains('card-header-clickable')) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={`mb-4 transition-all duration-300 relative ${isComplete ? 'border-green-400' : ''}`}
    >
      {showLed && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse z-50" />
      )}
      
      <CardHeader 
        className="py-3 card-header-clickable cursor-pointer"
        onClick={handleCardClick}
      >
        <RoomHeader
          room={room}
          roomIndex={roomIndex}
          totalRooms={totalRooms}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          onNavigateRoom={onNavigateRoom}
          onDeleteRoom={handleDeleteRoom}
          completionPercentage={completionPercentage}
          isComplete={isComplete}
        />
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="p-0">
            <RoomContent
              reportId={reportId}
              room={room}
              onUpdateGeneralCondition={onUpdateGeneralCondition}
              onUpdateComponents={onUpdateComponents}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default UnifiedRoomView;
