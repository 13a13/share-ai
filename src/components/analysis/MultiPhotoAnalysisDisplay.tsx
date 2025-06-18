
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Camera, TrendingUp } from "lucide-react";
import { MultiPhotoAnalysisResult } from "@/types";

interface MultiPhotoAnalysisDisplayProps {
  result: MultiPhotoAnalysisResult;
  componentName: string;
}

const MultiPhotoAnalysisDisplay = ({ result, componentName }: MultiPhotoAnalysisDisplayProps) => {
  const { multiImageAnalysis, analysisMetadata } = result;
  
  if (!multiImageAnalysis || analysisMetadata?.processingMode !== 'multi') {
    return null; // Don't show for single image analysis
  }

  const consistencyColor = multiImageAnalysis.consistencyScore >= 0.8 ? 'text-green-600' : 
                          multiImageAnalysis.consistencyScore >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Multi-Photo Analysis Results
          <Badge variant="secondary">{multiImageAnalysis.imageCount} images</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Consistency Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Consistency Score:</span>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${consistencyColor}`} />
            <span className={`text-sm font-semibold ${consistencyColor}`}>
              {Math.round(multiImageAnalysis.consistencyScore * 100)}%
            </span>
          </div>
        </div>

        {/* Consolidated Findings */}
        {multiImageAnalysis.consolidatedFindings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Consolidated Findings:
            </h4>
            <ul className="text-sm space-y-1">
              {multiImageAnalysis.consolidatedFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 text-xs mt-1">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conflicting Findings */}
        {multiImageAnalysis.conflictingFindings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Conflicting Findings:
            </h4>
            <ul className="text-sm space-y-1">
              {multiImageAnalysis.conflictingFindings.map((conflict, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 text-xs mt-1">•</span>
                  <span className="text-yellow-800">{conflict}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Processing Metadata */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Processed with {analysisMetadata.aiModel} in {analysisMetadata.processingTime}ms
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiPhotoAnalysisDisplay;
