
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface ComponentActionsProps {
  componentId: string;
  isEditing: boolean;
  isOptional: boolean;
  onToggleEditMode: (componentId: string) => void;
  onRemoveComponent: (componentId: string) => void;
}

const ComponentActions = ({
  componentId,
  isEditing,
  isOptional,
  onToggleEditMode,
  onRemoveComponent
}: ComponentActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {!isEditing && (
        <Button
          variant="outline"
          onClick={() => onToggleEditMode(componentId)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      )}
      
      {isOptional && (
        <Button
          variant="outline"
          className="text-red-500 hover:text-red-700 ml-auto"
          onClick={() => onRemoveComponent(componentId)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      )}
    </div>
  );
};

export default ComponentActions;
