
import { RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { cleanlinessOptions } from "@/services/imageProcessingService";

interface ComponentAnalysisSummaryProps {
  component: RoomComponent;
  onEdit: () => void;
}

const ComponentAnalysisSummary = ({ component, onEdit }: ComponentAnalysisSummaryProps) => {
  // Convert cleanliness value to display label
  const cleanlinessLabel = component.cleanliness 
    ? cleanlinessOptions.find(opt => opt.value === component.cleanliness)?.label 
    : null;

  return (
    <div className="border rounded-md p-3 mt-2 bg-gray-50 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium">Component Analysis</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 -mt-1 -mr-1 text-shareai-teal" 
          onClick={onEdit}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Edit</span>
        </Button>
      </div>
      
      {component.description && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Description</h4>
          <p className="text-sm">{component.description}</p>
        </div>
      )}
      
      {component.conditionSummary && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Condition Summary</h4>
          <p className="text-sm">{component.conditionSummary}</p>
        </div>
      )}
      
      {component.conditionPoints && component.conditionPoints.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Condition Details</h4>
          <ul className="list-disc pl-5 text-sm">
            {component.conditionPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      
      {cleanlinessLabel && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Cleanliness</h4>
          <p className="text-sm">{cleanlinessLabel}</p>
        </div>
      )}
      
      {component.notes && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Notes</h4>
          <p className="text-sm italic">{component.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ComponentAnalysisSummary;
