
import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, InfoIcon } from "lucide-react";
import { Room, RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RoomComponentView from "./RoomComponentView";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CollapsibleRoomSectionProps {
  room: Room;
  roomIndex: number;
  totalRooms: number;
  onNavigateRoom: (index: number) => void;
  isComplete: boolean;
}

const CollapsibleRoomSection = ({ 
  room, 
  roomIndex, 
  totalRooms, 
  onNavigateRoom,
  isComplete 
}: CollapsibleRoomSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNextRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex + 1);
  };

  const handlePrevRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex - 1);
  };

  return (
    <Card className={`mb-4 transition-all duration-300 ${isComplete ? 'border-green-400' : ''} ${!isComplete && !isExpanded ? 'animate-pulse-opacity' : ''}`}>
      <CardHeader 
        className="px-4 py-3 flex flex-row justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
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
          <CardContent className="px-4 py-3">
            <div className="space-y-1 mb-4">
              <h3 className="text-sm font-medium text-gray-500">General Condition</h3>
              <p>{room.generalCondition || "No general condition specified."}</p>
            </div>
            
            {room.components && room.components.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">Components</h3>
                {room.components.map((component) => (
                  <RoomComponentView key={component.id} component={component} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No components available for this room.</p>
            )}
            
            {room.images && room.images.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Room Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {room.images.map((image) => (
                    <div key={image.id} className="relative rounded overflow-hidden border">
                      <img 
                        src={image.url} 
                        alt={`${room.name}`} 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CollapsibleRoomSection;
