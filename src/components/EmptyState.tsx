
import { Button } from "@/components/ui/button";
import { FolderPlus, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon = <FolderPlus className="h-12 w-12 text-shareai-teal mb-4" />
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg bg-gray-50">
      {icon}
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
