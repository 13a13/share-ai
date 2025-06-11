
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { CheckoutComparison, CheckoutData } from '@/lib/api/reports/checkoutTypes';
import ComponentProcessingStatus from '../ComponentProcessingStatus';
import CheckoutRoomAssessment from '../CheckoutRoomAssessment';

interface CheckoutStep3Props {
  checkoutData: CheckoutData;
  comparisons: CheckoutComparison[];
  isLoadingComparisons: boolean;
  onComparisonUpdate: (updatedComparison: CheckoutComparison) => void;
  onCompleteCheckout: () => void;
}

const CheckoutStep3 = ({
  checkoutData,
  comparisons,
  isLoadingComparisons,
  onComparisonUpdate,
  onCompleteCheckout
}: CheckoutStep3Props) => {
  const getCompletedAssessments = () => {
    return comparisons.filter(comp => comp.status !== 'pending').length;
  };

  const getUnchangedAssessments = () => {
    return comparisons.filter(comp => comp.status === 'unchanged').length;
  };

  const getChangedAssessments = () => {
    return comparisons.filter(comp => comp.status === 'changed').length;
  };

  const getPendingAssessments = () => {
    return comparisons.filter(comp => comp.status === 'pending').length;
  };

  const getTotalAssessments = () => {
    return comparisons.length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Step 3: Component Assessment</span>
          <div className="flex gap-2">
            <Badge className="bg-blue-500">
              {getCompletedAssessments()}/{getTotalAssessments()} Assessed
            </Badge>
            <Badge className="bg-green-500">Ready for Assessment</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Review each component and determine if there are any changes since check-in. 
            You can mark items as "No Changes" or document any changes found with photos and descriptions.
          </p>
          
          {isLoadingComparisons ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading components for assessment...</p>
            </div>
          ) : comparisons.length > 0 ? (
            <>
              <ComponentProcessingStatus
                totalComponents={getTotalAssessments()}
                pendingComponents={getPendingAssessments()}
                unchangedComponents={getUnchangedAssessments()}
                changedComponents={getChangedAssessments()}
                isProcessing={false}
              />
              
              <CheckoutRoomAssessment
                checkoutReportId="pending"
                comparisons={comparisons}
                onComparisonUpdate={onComparisonUpdate}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No components found for assessment.</p>
              <p className="text-sm text-gray-500">
                This might happen if the check-in report doesn't have any components recorded.
              </p>
            </div>
          )}
        </div>

        {comparisons.length > 0 && getCompletedAssessments() === getTotalAssessments() && (
          <div className="border-t pt-4">
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ All Components Assessed!
              </h3>
              <p className="text-green-700">
                You've completed the assessment of all {getTotalAssessments()} components. 
                You can now complete the checkout process to create the final report.
              </p>
            </div>
            
            <Button 
              onClick={onCompleteCheckout}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Checkout Process
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckoutStep3;
