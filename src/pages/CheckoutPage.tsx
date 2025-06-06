
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
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
            <h1 className="text-2xl font-bold">Checkout Procedure - Step 1</h1>
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

        {/* Main Content */}
        {!checkoutReport ? (
          <Card>
            <CardHeader>
              <CardTitle>Start Basic Checkout Procedure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This is Step 1 of the checkout implementation. Click below to create a basic checkout record.
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
                    'Start Basic Checkout'
                  )}
                </Button>
              </CheckoutProcedureDialog>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Basic Checkout Created Successfully!</span>
                <Button 
                  onClick={completeCheckout}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Checkout
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
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
                    <span className="text-gray-600">Created:</span>
                    <p className="font-medium">{new Date(checkoutReport.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Clerk:</span>
                    <p className="font-medium">{checkoutReport.checkout_clerk || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
