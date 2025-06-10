
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CheckCircle, AlertTriangle, Save, ArrowRight } from 'lucide-react';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import CheckinDataDisplay from './CheckinDataDisplay';
import AssessmentActions from './AssessmentActions';
import ChangesDocumentation from './ChangesDocumentation';
import CompletedAssessment from './CompletedAssessment';
import AssessmentProgress from './AssessmentProgress';

interface ComponentAssessmentCardProps {
  comparison: CheckoutComparison;
  isExpanded: boolean;
  isUpdating: boolean;
  changeDescription: string;
  currentIndex: number;
  totalComponents: number;
  onToggleExpanded: (comparisonId: string) => void;
  onStatusChange: (comparisonId: string, status: 'unchanged' | 'changed') => void;
  onDescriptionSave: (comparisonId: string, description: string) => void;
  onImagesProcessed: (comparisonId: string, imageUrls: string[], result: any) => void;
  onProcessingStateChange: (comparisonId: string, processing: boolean) => void;
  onSaveAndNext?: () => void;
  onNext?: () => void;
}

const ComponentAssessmentCard = ({
  comparison,
  isExpanded,
  isUpdating,
  changeDescription,
  currentIndex,
  totalComponents,
  onToggleExpanded,
  onStatusChange,
  onDescriptionSave,
  onImagesProcessed,
  onProcessingStateChange,
  onSaveAndNext,
  onNext
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unchanged': return 'No Changes Found';
      case 'changed': return 'Changes Documented';
      default: return 'Awaiting Assessment';
    }
  };

  const hasAssessment = comparison.status !== 'pending';
  const canProceed = hasAssessment || comparison.status === 'unchanged';

  return (
    <Card className="border border-gray-200 transition-all hover:border-blue-300 mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(comparison.status)}`}>
              {getStatusIcon(comparison.status)}
            </div>
            <div>
              <h4 className="font-medium text-lg">{comparison.component_name}</h4>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500">
                  Status: {getStatusText(comparison.status)}
                </p>
                <AssessmentProgress 
                  current={currentIndex + 1} 
                  total={totalComponents} 
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 border-t pt-4">
          {/* Check-in Reference Data */}
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

          {/* Assessment Actions */}
          <AssessmentActions
            comparisonId={comparison.id}
            status={comparison.status}
            isUpdating={isUpdating}
            onStatusChange={onStatusChange}
            onFoundChanges={() => {
              // Auto-expand documentation section when changes are found
              if (comparison.status === 'pending') {
                onStatusChange(comparison.id, 'changed');
              }
            }}
          />

          {/* Changes Documentation */}
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

          {/* Completed Assessment */}
          <CompletedAssessment status={comparison.status} />

          {/* Save & Navigation Controls */}
          {(hasAssessment || comparison.status === 'unchanged') && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Assessment {comparison.status === 'unchanged' ? 'completed' : 'documented'}
              </div>
              <div className="flex items-center gap-2">
                {onSaveAndNext && (
                  <Button
                    onClick={onSaveAndNext}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save & Next
                  </Button>
                )}
                {onNext && currentIndex < totalComponents - 1 && (
                  <Button
                    variant="outline"
                    onClick={onNext}
                    disabled={!canProceed || isUpdating}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next Component
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ComponentAssessmentCard;
