
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Camera, Zap } from "lucide-react";
import StagingImagesGrid from "../image-upload/StagingImagesGrid";

interface ComponentStagingAreaProps {
  componentId: string;
  componentName: string;
  stagedImages: string[];
  isProcessing: boolean;
  onRemoveStagedImage: (componentId: string, imageIndex: number) => void;
  onProcessComponent: (componentId: string) => Promise<void>;
  onClearStaging: (componentId: string) => void;
  disabled?: boolean;
}

const ComponentStagingArea = ({
  componentId,
  componentName,
  stagedImages,
  isProcessing,
  onRemoveStagedImage,
  onProcessComponent,
  onClearStaging,
  disabled = false
}: ComponentStagingAreaProps) => {
  
  if (stagedImages.length === 0) return null;

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Staged for Analysis
            <Badge variant="secondary">{stagedImages.length}</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClearStaging(componentId)}
            disabled={isProcessing || disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <StagingImagesGrid
          images={stagedImages}
          onRemoveImage={(index) => onRemoveStagedImage(componentId, index)}
          onMoveImage={() => {}} // Component staging doesn't need reordering
          compressionInProgress={false}
        />
        
        <Button
          onClick={() => onProcessComponent(componentId)}
          disabled={isProcessing || disabled || stagedImages.length === 0}
          className="w-full"
          variant="default"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isProcessing ? 'Analyzing...' : `Analyze ${componentName} (${stagedImages.length} photos)`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComponentStagingArea;
