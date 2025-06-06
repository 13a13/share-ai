
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, Loader2, FileCheck, Users } from 'lucide-react';
import Header from '@/components/Header';
import { ReportsAPI } from '@/lib/api';
import { useCheckoutProcedure } from '@/hooks/useCheckoutProcedure';
import CheckoutProcedureDialog from '@/components/checkout/CheckoutProcedureDialog';
import { Report } from '@/types';
import { useToast } from '@/components/ui/use-toast';

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
    startCheckoutProcedure,
    completeCheckout
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

  const getCurrentStep = () => {
    if (!checkoutReport) return 1;
    if (comparisons.length === 0) return 2;
    return 2; // For now, we're implementing step 2
  };

  const currentStep = getCurrentStep();

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

        {/* Status Card */}
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

        {/* Step 1: Start Checkout */}
        {!checkoutReport && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Start Checkout Procedure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create a checkout record and initialize component comparisons.
              </p>
              <CheckoutProcedureDialog
                checkinReport={checkinReport}
                onStartCheckout={startCheckoutProcedure}
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

        {/* Step 2: Component Comparison Setup */}
        {checkoutReport && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Step 2: Component Comparison Setup</span>
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
                      <span className="text-gray-600">Components Found:</span>
                      <p className="font-medium">{checkoutReport.componentsCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Clerk:</span>
                      <p className="font-medium">{checkoutReport.checkout_clerk || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {isLoadingComparisons ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading components...</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Components Ready for Comparison ({comparisons.length})
                    </h4>
                    
                    {comparisons.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {comparisons.map((comparison) => (
                          <div key={comparison.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{comparison.component_name}</span>
                              <p className="text-sm text-gray-500">Room: {comparison.room_id}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {comparison.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No components found for comparison.</p>
                    )}

                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-4">
                        ✅ Step 2 Complete: Component comparisons have been initialized. 
                        <br />
                        <strong>Next:</strong> Step 3 will allow individual component assessment.
                      </p>
                      
                      <Button 
                        onClick={completeCheckout}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Checkout (For Now)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
