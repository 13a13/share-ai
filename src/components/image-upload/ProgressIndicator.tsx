
import { ProgressIndicator } from "../ui/progress-indicator";

interface ProgressIndicatorProps {
  progress: number;
}

const ImageUploadProgress = ({ progress }: ProgressIndicatorProps) => {
  return (
    <ProgressIndicator 
      value={progress} 
      text="Preparing images..." 
      showPercentage={true} 
    />
  );
};

export default ImageUploadProgress;
