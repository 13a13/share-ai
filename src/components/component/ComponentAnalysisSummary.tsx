
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit, Eye, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { RoomComponent } from "@/types";
import { 
  conditionRatingToText, 
  cleanlinessOptions,
  normalizeConditionPoints,
  isAdvancedAnalysis 
} from "@/services/imageProcessingService";

interface ComponentAnalysisSummaryProps {
  component: RoomComponent;
  onEdit: () => void;
}

const ComponentAnalysisSummary = ({ component, onEdit }: ComponentAnalysisSummaryProps) => {
  const cleanlinessLabel = cleanlinessOptions.find(
    option => option.value === component.cleanliness
  )?.label || component.cleanliness;

  const conditionPoints = normalizeConditionPoints(component.conditionPoints || []);
  const isAdvanced = component.images.some(img => 
    img.aiData?.analysisMode === 'advanced' || img.aiData?.crossAnalysis
  );

  const getConfidenceIcon = (confidence?: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getAnalysisModeBadge = () => {
    if (isAdvanced) {
      return <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Advanced Analysis</Badge>;
    }
    
    const latestAnalysis = component.images
      .filter(img => img.aiData?.analysisMode)
      .pop()?.aiData?.analysisMode;
      
    if (latestAnalysis === 'inventory') {
      return <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">Inventory Mode</Badge>;
    }
    
    return <Badge variant="outline" className="text-xs">Standard</Badge>;
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm font-medium">AI Analysis Summary</CardTitle>
            {getAnalysisModeBadge()}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="h-7 px-2 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {component.description && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {component.description}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-medium text-gray-600">Condition:</span>
            <div className="mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  component.condition === 'excellent' ? 'border-green-500 text-green-700' :
                  component.condition === 'good' ? 'border-blue-500 text-blue-700' :
                  component.condition === 'fair' ? 'border-yellow-500 text-yellow-700' :
                  'border-red-500 text-red-700'
                }`}
              >
                {conditionRatingToText(component.condition || 'fair')}
              </Badge>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-600">Cleanliness:</span>
            <p className="text-gray-800 mt-1">{cleanlinessLabel}</p>
          </div>
        </div>

        {component.conditionSummary && (
          <>
            <Separator />
            <div>
              <span className="font-medium text-gray-600 text-xs">Summary:</span>
              <p className="text-sm text-gray-700 mt-1">{component.conditionSummary}</p>
            </div>
          </>
        )}

        {conditionPoints.length > 0 && (
          <>
            <Separator />
            <div>
              <span className="font-medium text-gray-600 text-xs">Key Points:</span>
              <ul className="mt-2 space-y-1">
                {conditionPoints.slice(0, 3).map((point, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
                {conditionPoints.length > 3 && (
                  <li className="text-xs text-gray-500 italic">
                    +{conditionPoints.length - 3} more points...
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Enhanced analysis display for advanced mode */}
        {isAdvanced && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="font-medium text-gray-600 text-xs">Advanced Analysis:</span>
              
              {component.images.map((image, idx) => {
                const aiData = image.aiData;
                if (!aiData?.crossAnalysis && !aiData?.defectAnalysis) return null;
                
                return (
                  <div key={idx} className="bg-white p-2 rounded border text-xs">
                    {aiData.defectAnalysis && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Defect Confidence:</span>
                        {getConfidenceIcon(aiData.defectAnalysis.overallConfidence)}
                        <span className="capitalize">{aiData.defectAnalysis.overallConfidence}</span>
                      </div>
                    )}
                    
                    {aiData.crossAnalysis?.materialConsistency !== null && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600">Material Consistency:</span>
                        {aiData.crossAnalysis.materialConsistency ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span>{aiData.crossAnalysis.materialConsistency ? 'Consistent' : 'Inconsistent'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {component.notes && (
          <>
            <Separator />
            <div>
              <span className="font-medium text-gray-600 text-xs">Notes:</span>
              <p className="text-sm text-gray-700 mt-1">{component.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentAnalysisSummary;
