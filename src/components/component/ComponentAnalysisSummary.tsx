
import { RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit, Check, AlertTriangle } from "lucide-react";
import { 
  conditionRatingOptions, 
  cleanlinessOptions,
  isAdvancedAnalysis
} from "@/services/imageProcessingService";

interface ComponentAnalysisSummaryProps {
  component: RoomComponent;
  onEdit: () => void;
}

const ComponentAnalysisSummary = ({ component, onEdit }: ComponentAnalysisSummaryProps) => {
  const conditionOption = conditionRatingOptions.find(option => 
    option.value === component.condition
  );
  
  const cleanlinessOption = cleanlinessOptions.find(option => 
    option.value === component.cleanliness
  );
  
  // Determine if this is an advanced analysis result
  const isAdvanced = component.images.some(img => 
    img.aiData && isAdvancedAnalysis(img.aiData)
  );
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      {isAdvanced && (
        <div className="mb-3 flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            AI Analysis Complete
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-sm text-gray-700 mt-1">{component.description}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium">Detailed Findings</h4>
          <p className="text-sm text-gray-700 mt-1">{component.conditionSummary}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center mt-3">
          {conditionOption && (
            <span 
              className={`text-xs font-medium px-2 py-1 rounded-full text-white ${conditionOption.color}`}
            >
              {conditionOption.label}
            </span>
          )}
          
          {cleanlinessOption && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200">
              {cleanlinessOption.label}
            </span>
          )}
          
          {component.notes && (
            <div className="flex items-center ml-1">
              <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
              <span className="text-xs text-gray-600">Has notes</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          className="flex items-center"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ComponentAnalysisSummary;
