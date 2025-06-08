
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, Loader2, FileCheck, Users, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import { ReportsAPI } from '@/lib/api';
import { useCheckoutProcedure } from '@/hooks/useCheckoutProcedure';
import CheckoutProcedureDialog from '@/components/checkout/CheckoutProcedureDialog';
import CheckoutRoomAssessment from '@/components/checkout/CheckoutRoomAssessment';
import ComponentProcessingStatus from '@/components/checkout/ComponentProcessingStatus';
import { Report } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutComparison } from '@/lib/api/reports/checkoutTypes';

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

  // Debug log for current state
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Checkout Procedure - Step {currentStep}</h1>
            <p className="text-gray-600">
              Property: {checkinReport.property?.name || 'Unknown Property'}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <span className="ml-2 text-sm">Create Checkout</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <span className="ml-2 text-sm">Setup Components</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
                </div>
                <span className="ml-2 text-sm">Assess Components</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Report Info */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Check-in Report Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Check-in Date</p>
                  <span className="font-semibold">
                    {new Date(checkinReport.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Rooms</p>
                  <span className="font-semibold">
                    {checkinReport.rooms.length} rooms
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="font-semibold">
                    {checkinReport.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Create Basic Checkout */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Checkout Record</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create a basic checkout record with your details and checkout information.
              </p>
              <CheckoutProcedureDialog
                checkinReport={checkinReport}
                onStartCheckout={createBasicCheckout}
                isCreating={isCreatingCheckout}
              >
                <Button disabled={isCreatingCheckout} size="lg">
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Checkout...
                    </>
                  ) : (
                    'Start Checkout Procedure'
                  )}
                </Button>
              </CheckoutProcedureDialog>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Initialize Components */}
        {currentStep === 2 && checkoutReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 2: Initialize Component Comparisons</span>
                <Badge className="bg-green-500">Checkout Created</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-green-800 mb-2">Checkout Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Checkout ID:</span>
                    <p className="font-medium">{checkoutReport.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">{checkoutReport.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Clerk:</span>
                    <p className="font-medium">{checkoutReport.checkout_clerk || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tenant:</span>
                    <p className="font-medium">{checkoutReport.checkout_tenant_name || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                Now we'll set up component comparisons from your original check-in report.
              </p>

              <Button 
                onClick={initializeComparisons}
                disabled={isLoadingComparisons}
                size="lg"
              >
                {isLoadingComparisons ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up Components...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Initialize Component Comparisons
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Component Assessment */}
        {currentStep === 3 && checkoutReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Step 3: Component Assessment</span>
                <div className="flex gap-2">
                  <Badge className="bg-blue-500">
                    {getCompletedAssessments()}/{getTotalAssessments()} Assessed
                  </Badge>
                  <Badge className="bg-green-500">Setup Complete</Badge>
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
                      isProcessing={Object.values(comparisons).some(comp => comp.status === 'pending')}
                    />
                    
                    <CheckoutRoomAssessment
                      checkoutReportId={checkoutReport.id}
                      comparisons={comparisons}
                      onComparisonUpdate={handleComparisonUpdate}
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
                      You can now complete the checkout process.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={completeCheckout}
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
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
