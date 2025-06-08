
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Clock } from "lucide-react";

interface RoomDetailsHeaderProps {
  roomName: string;
  reportId: string;
  roomId: string;
  pendingCount: number;
  isSaving: boolean;
  roomCompletionPercentage: number;
  overallProgress: number;
  onForceSave: () => Promise<void>;
}

const RoomDetailsHeader = ({
  roomName,
  reportId,
  roomId,
  pendingCount,
  isSaving,
  roomCompletionPercentage,
  overallProgress,
  onForceSave
}: RoomDetailsHeaderProps) => {
  return (
    <div className="pb-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{roomName}</h2>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={onForceSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              {isSaving ? "Saving..." : "Save Now"}
            </Button>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Room completion</span>
          <span className="text-xs text-gray-500">{roomCompletionPercentage}%</span>
        </div>
        <Progress value={roomCompletionPercentage} className="h-2" />
      </div>
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Overall report progress</span>
          <span className="text-xs text-gray-500">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>
    </div>
  );
};

export default RoomDetailsHeader;
