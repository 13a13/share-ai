
import { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit 
} from "lucide-react";
import { Room, RoomComponent, RoomSection } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRoomComponents } from "@/hooks/useRoomComponents";
import ComponentList from "./ComponentList";

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
  isComplete = false
}: UnifiedRoomViewProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Calculate completion percentage for components
  const requiredComponents = room.components?.filter(c => !c.isOptional) || [];
  const filledRequiredComponents = requiredComponents.filter(c => 
    c.description && c.condition && (c.images.length > 0 || c.notes)
  );
  const completionPercentage = requiredComponents.length > 0 
    ? Math.round((filledRequiredComponents.length / requiredComponents.length) * 100) 
    : 100;
  
  // Room components hook
  const {
    components,
    isProcessing,
    expandedComponents,
    selectedComponentType,
    availableComponents,
    setSelectedComponentType,
    handleAddComponent,
    handleRemoveComponent,
    handleUpdateComponent,
    toggleEditMode,
    handleRemoveImage,
    handleImageProcessed,
    handleComponentProcessingState,
    toggleExpandComponent
  } = useRoomComponents({
    roomId: room.id,
    roomType: room.type,
    initialComponents: room.components || [],
    onChange: (updatedComponents) => onUpdateComponents(room.id, updatedComponents)
  });
  
  useEffect(() => {
    // Auto-scroll to this room if it's incomplete and marked for attention
    if (!isComplete && isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isExpanded, isComplete]);
  
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

  const handleNextRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex + 1);
  };

  const handlePrevRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex - 1);
  };

  return (
    <Card 
      ref={cardRef}
      className={`mb-4 transition-all duration-300 ${isComplete ? 'border-green-400' : ''} ${!isComplete && !isExpanded ? 'animate-pulse-opacity' : ''}`}
    >
      <CardHeader 
        className="py-3 flex flex-row justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col">
          <CardTitle className="text-lg flex items-center gap-2">
            {room.name}
            <Badge className="bg-shareai-teal text-white">{room.type.replace('_', ' ')}</Badge>
            {isComplete && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="bg-green-500">Complete</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">This room has all required components documented</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <div className="mt-2 w-full">
            <div className="flex items-center gap-2">
              <Progress value={completionPercentage} className="h-2" />
              <span className="text-xs text-gray-500">{completionPercentage}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 mr-1"
                    disabled={roomIndex === 0}
                    onClick={handlePrevRoom}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-1">Previous</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to previous room</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    disabled={roomIndex === totalRooms - 1}
                    onClick={handleNextRoom}
                  >
                    <span className="sr-only md:not-sr-only md:mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to next room</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
            e.stopPropagation();
            handleDeleteRoom();
          }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="px-4 py-3 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">General Condition</h3>
                <Textarea 
                  value={room.generalCondition}
                  onChange={(e) => onUpdateGeneralCondition(room.id, e.target.value)}
                  placeholder="Describe the general condition of the room..."
                  className="min-h-[80px]"
                />
              </div>
              
              <ComponentList
                roomType={room.type}
                components={components}
                isProcessing={isProcessing}
                expandedComponents={expandedComponents}
                selectedComponentType={selectedComponentType}
                availableComponents={availableComponents}
                onSelectComponent={setSelectedComponentType}
                onAddComponent={handleAddComponent}
                onToggleExpand={toggleExpandComponent}
                onRemoveComponent={handleRemoveComponent}
                onToggleEditMode={toggleEditMode}
                onUpdateComponent={handleUpdateComponent}
                onRemoveImage={handleRemoveImage}
                onImageProcessed={handleImageProcessed}
                onProcessingStateChange={handleComponentProcessingState}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default UnifiedRoomView;
