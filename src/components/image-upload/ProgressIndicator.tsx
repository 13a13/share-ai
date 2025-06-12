
import { ProgressIndicator } from "../ui/progress-indicator";

interface ProgressIndicatorProps {
  compressionInProgress?: boolean;
  analysisInProgress?: boolean;
  stagingImagesCount?: number;
  value?: number;
  text?: string;
  isLoading?: boolean;
}

const ImageUploadProgress = ({ 
  compressionInProgress = false,
  analysisInProgress = false,
  stagingImagesCount = 0,
  value = 0,
  text,
  isLoading = true
}: ProgressIndicatorProps) => {
  // Determine the appropriate text and progress based on the state
  const progressText = text || 
    (compressionInProgress ? `Compressing ${stagingImagesCount} images...` : 
     analysisInProgress ? `Analyzing ${stagingImagesCount} images...` : 
     "Processing...");

  const progressValue = value || 
    (compressionInProgress ? 30 : 
     analysisInProgress ? 70 : 0);

  return (
    <ProgressIndicator 
      value={progressValue} 
      text={progressText} 
      isLoading={isLoading}
      showPercentage={true} 
    />
  );
};

export default ImageUploadProgress;
