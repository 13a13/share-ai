
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Trash2
} from "lucide-react";
import { Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoomHeaderProps {
  room: Room;
  roomIndex: number;
  totalRooms: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onNavigateRoom: (index: number) => void;
  onDeleteRoom: () => void;
  completionPercentage: number;
  isComplete: boolean;
}

const RoomHeader = ({
  room,
  roomIndex,
  totalRooms,
  isExpanded,
  setIsExpanded,
  onNavigateRoom,
  onDeleteRoom,
  completionPercentage,
  isComplete
}: RoomHeaderProps) => {
  const handleNextRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex + 1);
  };

  const handlePrevRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateRoom(roomIndex - 1);
  };

  return (
    <div 
      className="py-3 flex flex-row justify-between items-center cursor-pointer" 
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col">
        <div className="text-lg flex items-center gap-2">
          {room.name}
          <Badge className="bg-verifyvision-teal text-white">{room.type.replace('_', ' ')}</Badge>
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
        </div>
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
          onDeleteRoom();
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
    </div>
  );
};

export default RoomHeader;
