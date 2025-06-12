
import { Report, CheckoutComparison, CheckoutData } from '@/types';
import CheckoutStep1 from './steps/CheckoutStep1';
import CheckoutStep2 from './steps/CheckoutStep2';
import CheckoutStep3 from './steps/CheckoutStep3';

interface CheckoutPageContentProps {
  checkinReport: Report;
  currentStep: number;
  checkoutData: CheckoutData | null;
  comparisons: CheckoutComparison[];
  isCreatingCheckout: boolean;
  isLoadingComparisons: boolean;
  onStartCheckout: (checkoutData: CheckoutData) => void;
  onInitializeAssessments: () => void;
  onUpdateComparison: (updatedComparison: CheckoutComparison) => void;
  onCompleteCheckout: () => void;
}

const CheckoutPageContent = ({
  checkinReport,
  currentStep,
  checkoutData,
  comparisons,
  isCreatingCheckout,
  isLoadingComparisons,
  onStartCheckout,
  onInitializeAssessments,
  onUpdateComparison,
  onCompleteCheckout
}: CheckoutPageContentProps) => {
  return (
    <>
      {currentStep === 1 && (
        <CheckoutStep1
          checkinReport={checkinReport}
          onStartCheckout={onStartCheckout}
          isCreating={isCreatingCheckout}
        />
      )}

      {currentStep === 2 && checkoutData && (
        <CheckoutStep2
          checkoutData={checkoutData}
          onInitializeAssessments={onInitializeAssessments}
          isLoadingComparisons={isLoadingComparisons}
        />
      )}

      {currentStep === 3 && checkoutData && (
        <CheckoutStep3
          checkoutData={checkoutData}
          comparisons={comparisons}
          isLoadingComparisons={isLoadingComparisons}
          onComparisonUpdate={onUpdateComparison}
          onCompleteCheckout={onCompleteCheckout}
        />
      )}
    </>
  );
};

export default CheckoutPageContent;
