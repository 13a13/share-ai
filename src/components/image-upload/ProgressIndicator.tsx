
import { Progress } from "../ui/progress";

interface ProgressIndicatorProps {
  progress: number;
}

const ProgressIndicator = ({ progress }: ProgressIndicatorProps) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Preparing images...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
};

export default ProgressIndicator;
