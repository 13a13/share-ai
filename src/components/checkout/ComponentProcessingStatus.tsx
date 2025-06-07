
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertTriangle, Clock, FileText } from 'lucide-react';

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
    <Card className="mb-6 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Component Assessment Progress</h3>
          </div>
          <Badge className={progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}>
            {completedComponents}/{totalComponents} Complete
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <span className="text-sm text-gray-600 block">Pending</span>
              <Badge variant="secondary" className="text-lg font-semibold">
                {pendingComponents}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <span className="text-sm text-gray-600 block">No Changes</span>
              <Badge className="bg-green-500 text-lg font-semibold">
                {unchangedComponents}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <span className="text-sm text-gray-600 block">Changes Found</span>
              <Badge className="bg-orange-500 text-lg font-semibold">
                {changedComponents}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">%</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block">Progress</span>
              <Badge className="bg-blue-500 text-lg font-semibold">
                {Math.round(progressPercentage)}%
              </Badge>
            </div>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-blue-600 font-medium">Processing component data...</span>
          </div>
        )}
        
        {progressPercentage === 100 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 text-green-800 mb-2">
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold text-lg">Assessment Complete!</span>
            </div>
            <p className="text-green-700 mb-2">
              All {totalComponents} components have been assessed successfully.
            </p>
            <div className="text-sm text-green-600">
              <span className="font-medium">{unchangedComponents}</span> components with no changes • {' '}
              <span className="font-medium">{changedComponents}</span> components with changes documented
            </div>
            <p className="text-sm text-green-600 mt-2 font-medium">
              ✅ Ready to complete the checkout process
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentProcessingStatus;
