
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Room } from "@/types";
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

  return (
    <Card className={`mb-4 transition-none ${isComplete ? 'border-green-400' : ''}`}>
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
        <CollapsibleContent className="data-[state=open]:animate-none data-[state=closed]:animate-none">
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
