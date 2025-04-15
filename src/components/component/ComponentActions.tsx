
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Save, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComponentActionsProps {
  componentId: string;
  isEditing: boolean;
  isOptional: boolean;
  isAnalyzed?: boolean;
  onToggleEditMode: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
}

const ComponentActions = ({
  componentId,
  isEditing,
  isOptional,
  isAnalyzed = false,
  onToggleEditMode,
  onRemoveComponent
}: ComponentActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Button
        variant="outline"
        onClick={() => onToggleEditMode(componentId)}
        className={isAnalyzed && !isEditing ? "bg-green-50" : ""}
      >
        {isEditing ? (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        ) : (
          <>
            <Edit className="h-4 w-4 mr-2" />
            {isAnalyzed ? "Edit Details" : "Add Details"}
          </>
        )}
      </Button>
      
      {/* Remove isOptional check to allow all components to be deleted */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 ml-auto"
              onClick={() => onRemoveComponent(componentId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove this component from the room</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ComponentActions;
