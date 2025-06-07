
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import CheckinDataDisplay from './CheckinDataDisplay';
import AssessmentActions from './AssessmentActions';
import ChangesDocumentation from './ChangesDocumentation';
import CompletedAssessment from './CompletedAssessment';

interface ComponentAssessmentCardProps {
  comparison: CheckoutComparison;
  isExpanded: boolean;
  isUpdating: boolean;
  changeDescription: string;
  onToggleExpanded: (comparisonId: string) => void;
  onStatusChange: (comparisonId: string, status: 'unchanged' | 'changed') => void;
  onDescriptionSave: (comparisonId: string, description: string) => void;
  onImagesProcessed: (comparisonId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (comparisonId: string, processing: boolean) => void;
}

const ComponentAssessmentCard = ({
  comparison,
  isExpanded,
  isUpdating,
  changeDescription,
  onToggleExpanded,
  onStatusChange,
  onDescriptionSave,
  onImagesProcessed,
  onProcessingStateChange
}: ComponentAssessmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unchanged': return 'bg-green-500';
      case 'changed': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unchanged': return <CheckCircle className="h-4 w-4" />;
      case 'changed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border border-gray-200 transition-all hover:border-blue-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(comparison.status)}`}>
              {getStatusIcon(comparison.status)}
            </div>
            <div>
              <h4 className="font-medium">{comparison.component_name}</h4>
              <p className="text-sm text-gray-500">
                Status: {comparison.status === 'pending' ? 'Awaiting Assessment' : 
                         comparison.status === 'unchanged' ? 'No Changes' : 'Changes Found'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleExpanded(comparison.id)}
            disabled={isUpdating}
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Assess
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t">
          <CheckinDataDisplay
            componentName={comparison.component_name}
            checkinData={{
              originalCondition: comparison.ai_analysis?.checkinData?.originalCondition,
              originalDescription: comparison.ai_analysis?.checkinData?.originalDescription,
              originalImages: comparison.ai_analysis?.checkinData?.originalImages,
              timestamp: comparison.ai_analysis?.checkinData?.timestamp
            }}
            condition={comparison.ai_analysis?.condition}
            conditionSummary={comparison.ai_analysis?.conditionSummary}
            description={comparison.ai_analysis?.description}
            images={comparison.ai_analysis?.images}
          />

          <AssessmentActions
            comparisonId={comparison.id}
            status={comparison.status}
            isUpdating={isUpdating}
            onStatusChange={onStatusChange}
            onFoundChanges={() => onToggleExpanded(comparison.id)}
          />

          <ChangesDocumentation
            comparisonId={comparison.id}
            componentName={comparison.component_name}
            status={comparison.status}
            changeDescription={changeDescription}
            checkoutImages={comparison.checkout_images}
            isUpdating={isUpdating}
            onDescriptionSave={onDescriptionSave}
            onImagesProcessed={onImagesProcessed}
            onProcessingStateChange={onProcessingStateChange}
          />

          <CompletedAssessment status={comparison.status} />
        </CardContent>
      )}
    </Card>
  );
};

export default ComponentAssessmentCard;
