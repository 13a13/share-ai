
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface AssessmentActionsProps {
  comparisonId: string;
  status: string;
  isUpdating: boolean;
  onStatusChange: (comparisonId: string, status: 'unchanged' | 'changed') => void;
  onFoundChanges: () => void;
}

const AssessmentActions = ({
  comparisonId,
  status,
  isUpdating,
  onStatusChange,
  onFoundChanges
}: AssessmentActionsProps) => {
  if (status !== 'pending') return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
      <Button
        onClick={() => onStatusChange(comparisonId, 'unchanged')}
        disabled={isUpdating}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        No Changes
      </Button>
      
      <Button
        onClick={onFoundChanges}
        variant="outline"
        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Found Changes
      </Button>
    </div>
  );
};

export default AssessmentActions;
