
import { RoomComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Check, AlertTriangle, Save, X } from "lucide-react";
import { 
  conditionRatingOptions, 
  cleanlinessOptions,
  isAdvancedAnalysis,
  normalizeConditionPoints
} from "@/services/imageProcessingService";
import MultiPhotoAnalysisDisplay from "../analysis/MultiPhotoAnalysisDisplay";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ComponentAnalysisSummaryProps {
  component: RoomComponent;
  isEditing?: boolean;
  onEdit: () => void;
  onUpdateComponent?: (componentId: string, field: string, value: string | string[]) => void;
  onSaveComponent?: (componentId: string) => Promise<void>;
  onCancelEdit?: () => void;
}

const ComponentAnalysisSummary = ({ 
  component, 
  isEditing = false,
  onEdit, 
  onUpdateComponent, 
  onSaveComponent,
  onCancelEdit 
}: ComponentAnalysisSummaryProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  console.log(`🔍 [ComponentAnalysisSummary] Rendering analysis for component:`, {
    id: component.id,
    name: component.name,
    description: component.description,
    condition: component.condition,
    conditionSummary: component.conditionSummary,
    cleanliness: component.cleanliness,
    imagesCount: component.images?.length || 0
  });

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
  
  // Get the latest AI analysis data from multiple sources
  const latestAnalysis = component.images
    .filter(img => img.aiData)
    .sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )[0]?.aiData;
  
  console.log(`📊 [ComponentAnalysisSummary] Latest analysis data:`, latestAnalysis);
  
  // Get standardized condition points from multiple sources
  const conditionPoints = component.conditionPoints ? 
    normalizeConditionPoints(component.conditionPoints) : 
    (latestAnalysis?.condition?.points || []);
  
  // Enhanced description handling - use the best available description
  const displayDescription = component.description || 
                            latestAnalysis?.description || 
                            'Analysis completed';
  
  // Enhanced condition summary - use the best available summary
  const displayConditionSummary = component.conditionSummary || 
                                 latestAnalysis?.condition?.summary || 
                                 '';
  
  console.log(`🎯 [ComponentAnalysisSummary] Display values:`, {
    displayDescription,
    displayConditionSummary,
    conditionPoints,
    isAdvanced,
    isEditing
  });

  const handleSave = async () => {
    if (!onSaveComponent) {
      console.warn(`⚠️ ComponentAnalysisSummary: No save handler provided for component ${component.id}`);
      toast({
        title: "Save Failed",
        description: "No save handler available",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log(`💾 ComponentAnalysisSummary: Starting save for component ${component.id}`);
      await onSaveComponent(component.id);
      console.log(`✅ ComponentAnalysisSummary: Component ${component.id} saved successfully`);
      toast({
        title: "Saved",
        description: "Component changes have been saved successfully.",
      });
    } catch (error) {
      console.error(`❌ ComponentAnalysisSummary: Failed to save component ${component.id}:`, error);
      toast({
        title: "Save Failed",
        description: "Failed to save component changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleFieldUpdate = (field: string, value: string | string[]) => {
    if (onUpdateComponent) {
      onUpdateComponent(component.id, field, value);
    }
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      {isAdvanced && (
        <div className="mb-3 flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            Advanced Multi-Image Analysis
          </span>
        </div>
      )}
      
      {isEditing ? (
        // Inline editing mode
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${component.id}-description`}>Description</Label>
            <Textarea
              id={`${component.id}-description`}
              value={component.description || ''}
              onChange={(e) => handleFieldUpdate("description", e.target.value)}
              placeholder="Describe the component..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${component.id}-condition-summary`}>Condition Summary</Label>
            <Textarea
              id={`${component.id}-condition-summary`}
              value={component.conditionSummary || ''}
              onChange={(e) => handleFieldUpdate("conditionSummary", e.target.value)}
              placeholder="Summarize the condition..."
              className="min-h-[60px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${component.id}-condition`}>Condition Rating</Label>
              <Select 
                value={component.condition || 'fair'}
                onValueChange={(value) => handleFieldUpdate("condition", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditionRatingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <span 
                          className={`w-3 h-3 rounded-full ${option.color} mr-2`} 
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`${component.id}-cleanliness`}>Cleanliness</Label>
              <Select 
                value={component.cleanliness || ''}
                onValueChange={(value) => handleFieldUpdate("cleanliness", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cleanliness" />
                </SelectTrigger>
                <SelectContent>
                  {cleanlinessOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${component.id}-notes`}>Additional Notes</Label>
            <Textarea
              id={`${component.id}-notes`}
              value={component.notes || ''}
              onChange={(e) => handleFieldUpdate("notes", e.target.value)}
              placeholder="Any additional notes or observations..."
              className="min-h-[60px]"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!onSaveComponent || isSaving}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        // Display mode
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-sm text-gray-700 mt-1">{displayDescription}</p>
            {displayDescription === 'Analysis completed' && (
              <span className="text-xs text-muted-foreground">AI analysis processed successfully</span>
            )}
          </div>
          
          {(displayConditionSummary || conditionPoints.length > 0) && (
            <div>
              <h4 className="text-sm font-medium">Condition</h4>
              {displayConditionSummary && (
                <p className="text-sm text-gray-700 mt-1">{displayConditionSummary}</p>
              )}
              
              {conditionPoints.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 mt-2 pl-2 space-y-1">
                  {conditionPoints.map((point, idx) => (
                    <li key={idx}>{typeof point === 'string' ? point : point.label || point}</li>
                  ))}
                </ul>
              )}
              
              {!displayConditionSummary && conditionPoints.length === 0 && (
                <p className="text-sm text-gray-500 mt-1 italic">No specific condition issues detected</p>
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
      )}
    </div>
  );
};

export default ComponentAnalysisSummary;
