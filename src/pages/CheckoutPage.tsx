
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { ReportsAPI } from '@/lib/api';
import { useCheckoutProcedure } from '@/hooks/useCheckoutProcedure';
import { Report } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';
import { supabase } from '@/integrations/supabase/client';
import CheckoutPageHeader from '@/components/checkout/CheckoutPageHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import CheckinReportInfo from '@/components/checkout/CheckinReportInfo';
import CheckoutStep1 from '@/components/checkout/steps/CheckoutStep1';
import CheckoutStep2 from '@/components/checkout/steps/CheckoutStep2';
import CheckoutStep3 from '@/components/checkout/steps/CheckoutStep3';

const CheckoutPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkinReport, setCheckinReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    checkoutReport,
    isCreatingCheckout,
    comparisons,
    isLoadingComparisons,
    currentStep,
    createBasicCheckout,
    initializeComparisons,
    completeCheckout,
    setComparisons
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

        console.log('Fetched report:', report);
        console.log('Report rooms:', report.rooms);
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

  const handleComparisonUpdate = (updatedComparison: CheckoutComparison) => {
    setComparisons(prev => 
      prev.map(comp => 
        comp.id === updatedComparison.id ? updatedComparison : comp
      )
    );
  };

  const handleSaveReport = async () => {
    if (!checkoutReport) return;
    
    try {
      toast({
        title: "Saving Report",
        description: "Saving checkout report progress...",
      });
      
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'saved',
          updated_at: new Date().toISOString()
        })
        .eq('id', checkoutReport.id);

      if (error) throw error;
      
      toast({
        title: "Report Saved",
        description: "Checkout report has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    }
  };

  console.log('CheckoutPage state:', {
    currentStep,
    checkoutReport,
    comparisons: comparisons.length,
    isLoadingComparisons,
    checkinReport: checkinReport?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading checkout page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !checkinReport) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Report</h2>
              <p className="text-gray-600 mb-4">{error || 'The requested report could not be found.'}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/reports')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reports
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <CheckoutPageHeader
          currentStep={currentStep}
          propertyName={checkinReport?.property?.name}
          checkoutReport={checkoutReport}
          onSaveReport={handleSaveReport}
        />

        <CheckoutProgress currentStep={currentStep} />

        <CheckinReportInfo checkinReport={checkinReport} />

        {currentStep === 1 && (
          <CheckoutStep1
            checkinReport={checkinReport}
            onStartCheckout={createBasicCheckout}
            isCreating={isCreatingCheckout}
          />
        )}

        {currentStep === 2 && checkoutReport && (
          <CheckoutStep2
            checkoutReport={checkoutReport}
            onInitializeComparisons={initializeComparisons}
            isLoadingComparisons={isLoadingComparisons}
          />
        )}

        {currentStep === 3 && checkoutReport && (
          <CheckoutStep3
            checkoutReport={checkoutReport}
            comparisons={comparisons}
            isLoadingComparisons={isLoadingComparisons}
            onComparisonUpdate={handleComparisonUpdate}
            onCompleteCheckout={completeCheckout}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
