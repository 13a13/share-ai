
import { Progress } from '@/components/ui/progress';

interface AssessmentProgressProps {
  current: number;
  total: number;
  className?: string;
}

const AssessmentProgress = ({ current, total, className = '' }: AssessmentProgressProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-500 min-w-fit">
        {current} of {total}
      </span>
      <Progress value={percentage} className="w-16 h-1" />
    </div>
  );
};

export default AssessmentProgress;
