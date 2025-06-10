
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
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-medium text-gray-900 mb-3">Component Assessment</h4>
      <p className="text-sm text-gray-600 mb-4">
        Compare the check-in reference data above with the current condition of this component.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={() => onStatusChange(comparisonId, 'unchanged')}
          disabled={isUpdating}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          No Changes Found
        </Button>
        
        <Button
          onClick={onFoundChanges}
          variant="outline"
          className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
          size="lg"
          disabled={isUpdating}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Document Changes
        </Button>
      </div>
    </div>
  );
};

export default AssessmentActions;
