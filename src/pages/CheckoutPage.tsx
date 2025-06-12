
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReportsAPI } from '@/lib/api';
import { useCheckoutProcedure } from '@/hooks/useCheckoutProcedure';
import { Report } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import CheckoutLoadingState from '@/components/checkout/CheckoutLoadingState';
import CheckoutErrorState from '@/components/checkout/CheckoutErrorState';
import CheckoutPageLayout from '@/components/checkout/CheckoutPageLayout';
import CheckoutPageContent from '@/components/checkout/CheckoutPageContent';

const CheckoutPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkinReport, setCheckinReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    checkoutData,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    isDraftSaved,
    startCheckoutProcess,
    initializeAssessments,
    completeCheckout,
    updateComparison
  } = useCheckoutProcedure({ checkinReport });

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('No report ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Fetching report with ID:', reportId);
        setIsLoading(true);
        setError(null);
        
        const report = await ReportsAPI.getById(reportId);
        
        if (!report) {
          setError('Report not found');
          toast({
            title: "Report not found",
            description: "The requested report could not be found.",
            variant: "destructive",
          });
          return;
        }

        // Check if report is completed
        if (report.status !== 'completed') {
          setError('Only completed check-in reports can be used for checkout');
          toast({
            title: "Report Not Ready",
            description: "Only completed check-in reports can be used for checkout.",
            variant: "destructive",
          });
          return;
        }

        console.log('Fetched report:', report);
        setCheckinReport(report);
      } catch (error) {
        console.error('Error fetching report:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        toast({
          title: "Error",
          description: `Failed to load report data: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId, toast]);

  const handleCompleteCheckout = async () => {
    const result = await completeCheckout();
    if (result) {
      // Navigate back to the check-in report view to see the completed checkout
      navigate(`/reports/${reportId}/view`);
    }
  };

  console.log('CheckoutPage state:', {
    currentStep,
    checkoutData,
    comparisons: comparisons.length,
    isLoadingComparisons,
    checkinReport: checkinReport?.id,
    isDraftSaved
  });

  if (isLoading) {
    return <CheckoutLoadingState />;
  }

  if (error || !checkinReport) {
    return <CheckoutErrorState error={error || 'The requested report could not be found.'} />;
  }

  return (
    <CheckoutPageLayout
      checkinReport={checkinReport}
      currentStep={currentStep}
      isDraftSaved={isDraftSaved}
    >
      <CheckoutPageContent
        checkinReport={checkinReport}
        currentStep={currentStep}
        checkoutData={checkoutData}
        comparisons={comparisons}
        isCreatingCheckout={isCreatingCheckout}
        isLoadingComparisons={isLoadingComparisons}
        onStartCheckout={startCheckoutProcess}
        onInitializeAssessments={initializeAssessments}
        onUpdateComparison={updateComparison}
        onCompleteCheckout={handleCompleteCheckout}
      />
    </CheckoutPageLayout>
  );
};

export default CheckoutPage;
