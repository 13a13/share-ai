
import { CheckCircle } from 'lucide-react';

interface CompletedAssessmentProps {
  status: string;
}

const CompletedAssessment = ({ status }: CompletedAssessmentProps) => {
  if (status !== 'unchanged') return null;

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <div className="flex items-center gap-2 text-green-800">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">No Changes Detected</span>
      </div>
      <p className="text-sm text-green-700 mt-1">
        This component appears to be in the same condition as during check-in.
      </p>
    </div>
  );
};

export default CompletedAssessment;
