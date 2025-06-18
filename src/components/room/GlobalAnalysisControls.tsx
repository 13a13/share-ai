
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Camera, CheckCircle, AlertCircle } from "lucide-react";
import { ComponentStagingData, BatchAnalysisProgress } from "@/types";

interface GlobalAnalysisControlsProps {
  totalStagedImages: number;
  componentsWithStaging: ComponentStagingData[];
  analysisProgress: Map<string, BatchAnalysisProgress>;
  globalProcessing: boolean;
  onAnalyzeAll: () => Promise<void>;
  onClearAll: () => void;
}

const GlobalAnalysisControls = ({
  totalStagedImages,
  componentsWithStaging,
  analysisProgress,
  globalProcessing,
  onAnalyzeAll,
  onClearAll
}: GlobalAnalysisControlsProps) => {
  
  if (totalStagedImages === 0) return null;

  const getOverallProgress = () => {
    if (analysisProgress.size === 0) return 0;
    const totalProgress = Array.from(analysisProgress.values())
      .reduce((sum, progress) => sum + progress.progress, 0);
    return Math.round(totalProgress / analysisProgress.size);
  };

  const getStatusCounts = () => {
    const counts = {
      complete: 0,
      error: 0,
      processing: 0,
      pending: 0
    };
    
    Array.from(analysisProgress.values()).forEach(progress => {
      if (progress.status === 'complete') counts.complete++;
      else if (progress.status === 'error') counts.error++;
      else if (progress.status === 'uploading' || progress.status === 'analyzing') counts.processing++;
      else counts.pending++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();
  const overallProgress = getOverallProgress();

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-3">
          <Camera className="w-5 h-5 text-blue-600" />
          Batch Analysis Center
          <Badge variant="secondary" className="ml-auto">
            {totalStagedImages} photos staged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {componentsWithStaging.map((comp) => (
            <div key={comp.componentId} className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium truncate">{comp.componentName}</div>
              <div className="text-xs text-gray-500 mt-1">
                {comp.stagedImages.length} photos
              </div>
              {analysisProgress.has(comp.componentId) && (
                <div className="mt-2">
                  {analysisProgress.get(comp.componentId)?.status === 'complete' && (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  )}
                  {analysisProgress.get(comp.componentId)?.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                  )}
                  {(analysisProgress.get(comp.componentId)?.status === 'uploading' || 
                    analysisProgress.get(comp.componentId)?.status === 'analyzing') && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {globalProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>✅ {statusCounts.complete} complete</span>
              <span>🔄 {statusCounts.processing} processing</span>
              <span>❌ {statusCounts.error} errors</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onAnalyzeAll}
            disabled={globalProcessing || totalStagedImages === 0}
            className="flex-1"
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            {globalProcessing ? 'Analyzing All...' : `Analyze All Components (${totalStagedImages} photos)`}
          </Button>
          <Button
            variant="outline"
            onClick={onClearAll}
            disabled={globalProcessing}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalAnalysisControls;
