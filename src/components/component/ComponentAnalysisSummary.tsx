
import { RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit, Check, AlertTriangle } from "lucide-react";
import { 
  conditionRatingOptions, 
  cleanlinessOptions,
  isAdvancedAnalysis,
  normalizeConditionPoints
} from "@/services/imageProcessingService";
import MultiPhotoAnalysisDisplay from "../analysis/MultiPhotoAnalysisDisplay";

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
  
  // Get the latest AI analysis data
  const latestAnalysis = component.images
    .filter(img => img.aiData)
    .sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )[0]?.aiData;
  
  // Get standardized condition points
  const conditionPoints = component.conditionPoints ? 
    normalizeConditionPoints(component.conditionPoints) : 
    [];
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      {isAdvanced && (
        <div className="mb-3 flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            Advanced Multi-Image Analysis
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-sm text-gray-700 mt-1">{component.description}</p>
        </div>
        
        {component.conditionSummary && (
          <div>
            <h4 className="text-sm font-medium">Condition</h4>
            <p className="text-sm text-gray-700 mt-1">{component.conditionSummary}</p>
            
            {conditionPoints.length > 0 && (
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 pl-2 space-y-1">
                {conditionPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {isAdvanced && latestAnalysis?.crossAnalysis && (
          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-900">Cross-Image Analysis</h4>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              {latestAnalysis.crossAnalysis.materialConsistency !== null && (
                <div className="flex items-center">
                  <span className="text-xs text-gray-600">Material Consistency:</span>
                  <span className={`ml-2 text-xs font-medium ${
                    latestAnalysis.crossAnalysis.materialConsistency 
                      ? "text-green-700" 
                      : "text-amber-700"
                  }`}>
                    {latestAnalysis.crossAnalysis.materialConsistency ? "Yes" : "No"}
                  </span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-xs text-gray-600">Defect Confidence:</span>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${
                  latestAnalysis.crossAnalysis.defectConfidence === 'low' 
                    ? "bg-green-100 text-green-800" 
                    : latestAnalysis.crossAnalysis.defectConfidence === 'medium'
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}>
                  {latestAnalysis.crossAnalysis.defectConfidence}
                </span>
              </div>
            </div>
            
            {Array.isArray(latestAnalysis.crossAnalysis.multiAngleValidation) && 
             latestAnalysis.crossAnalysis.multiAngleValidation.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-700 font-medium">Multi-Angle Validations:</span>
                <ul className="mt-1 space-y-1">
                  {latestAnalysis.crossAnalysis.multiAngleValidation.map((item, idx) => (
                    <li key={idx} className="flex items-center text-xs">
                      <span>{item[0]}</span>
                      <span className="ml-1 px-1.5 rounded bg-blue-100 text-blue-800">
                        {item[1]} images
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Multi-Photo Analysis Results */}
        {component.images.length > 0 && component.images[0].aiData && (
          <MultiPhotoAnalysisDisplay 
            result={component.images[0].aiData}
            componentName={component.name}
          />
        )}
        
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
