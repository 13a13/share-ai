
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';

interface ComponentProcessingStatusProps {
  totalComponents: number;
  pendingComponents: number;
  unchangedComponents: number;
  changedComponents: number;
  isProcessing: boolean;
}

const ComponentProcessingStatus = ({
  totalComponents,
  pendingComponents,
  unchangedComponents,
  changedComponents,
  isProcessing
}: ComponentProcessingStatusProps) => {
  const completedComponents = unchangedComponents + changedComponents;
  const progressPercentage = totalComponents > 0 ? (completedComponents / totalComponents) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Assessment Progress</h3>
          <Badge className={progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}>
            {completedComponents}/{totalComponents} Complete
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Pending:</span>
            <Badge variant="secondary">{pendingComponents}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">No Changes:</span>
            <Badge className="bg-green-500">{unchangedComponents}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600">Changes:</span>
            <Badge className="bg-orange-500">{changedComponents}</Badge>
          </div>
          
          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-blue-600">Processing...</span>
            </div>
          )}
        </div>
        
        {progressPercentage === 100 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Assessment Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All components have been assessed. You can now complete the checkout process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentProcessingStatus;
