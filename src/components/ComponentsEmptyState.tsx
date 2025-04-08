
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ComponentsEmptyStateProps {
  onAddComponent: () => void;
}

const ComponentsEmptyState = ({ onAddComponent }: ComponentsEmptyStateProps) => {
  return (
    <Card className="border-dashed border-2 p-6">
      <div className="text-center text-gray-500">
        <p>No components added yet.</p>
        <Button 
          onClick={onAddComponent} 
          variant="outline" 
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" /> Add First Component
        </Button>
      </div>
    </Card>
  );
};

export default ComponentsEmptyState;
