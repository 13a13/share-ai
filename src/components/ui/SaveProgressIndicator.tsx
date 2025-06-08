
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface SaveProgressIndicatorProps {
  progress: {
    total: number;
    completed: number;
    currentOperation: string;
  } | null;
  className?: string;
}

const SaveProgressIndicator = ({ progress, className = "" }: SaveProgressIndicatorProps) => {
  if (!progress) return null;

  const percentage = Math.round((progress.completed / progress.total) * 100);

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">
                {progress.currentOperation}
              </span>
              <span className="text-xs text-blue-700">
                {percentage}%
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SaveProgressIndicator;
