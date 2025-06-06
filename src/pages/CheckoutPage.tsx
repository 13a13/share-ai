
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { ReportsAPI } from '@/lib/api';
import { useCheckoutProcedure } from '@/hooks/useCheckoutProcedure';
import CheckoutProcedureDialog from '@/components/checkout/CheckoutProcedureDialog';
import CheckoutComparisonCard from '@/components/checkout/CheckoutComparisonCard';
import { Report, RoomComponent } from '@/types';
import { useToast } from '@/components/ui/use-toast';

const CheckoutPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkinReport, setCheckinReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allComponents, setAllComponents] = useState<(RoomComponent & { roomId: string })[]>([]);

  const {
    checkoutReport,
    comparisons,
    isCreatingCheckout,
    isLoadingComparisons,
    startCheckoutProcedure,
    loadCheckoutComparisons,
    updateComparison,
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

        // Collect all components from all rooms
        const components: (RoomComponent & { roomId: string })[] = [];
        report.rooms.forEach(room => {
          if (room.components) {
            room.components.forEach(component => {
              components.push({
                ...component,
                roomId: room.id
              });
            });
          }
        });
        console.log('Found components:', components.length);
        setAllComponents(components);

        // Check if there's already a checkout report
        if (report.reportInfo?.checkoutReportId) {
          console.log('Existing checkout report found, loading comparisons...');
          await loadCheckoutComparisons(report.reportInfo.checkoutReportId);
        }
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
  }, [reportId, toast, loadCheckoutComparisons]);

  const getOriginalComponent = (componentId: string): RoomComponent | null => {
    return allComponents.find(comp => comp.id === componentId) || null;
  };

  const getProgressStats = () => {
    if (comparisons.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = comparisons.filter(comp => comp.status !== 'pending').length;
    const total = comparisons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const canCompleteCheckout = () => {
    return comparisons.length > 0 && comparisons.every(comp => comp.status !== 'pending');
  };

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

  const progressStats = getProgressStats();

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
            <h1 className="text-2xl font-bold">Checkout Procedure</h1>
            <p className="text-gray-600">
              Property: {checkinReport.property?.name || 'Unknown Property'}
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Check-in Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold">
                  {new Date(checkinReport.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Components to Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">
                  {progressStats.completed} / {progressStats.total}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={progressStats.percentage} className="h-2" />
                <span className="text-sm text-gray-600">{progressStats.percentage}% complete</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {!checkoutReport ? (
          <Card>
            <CardHeader>
              <CardTitle>Start Checkout Procedure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Begin the checkout procedure to compare the current condition of each component 
                with the check-in condition.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Found {allComponents.length} components to review from {checkinReport.rooms.length} rooms.
              </p>
              <CheckoutProcedureDialog
                checkinReport={checkinReport}
                onStartCheckout={startCheckoutProcedure}
                isCreating={isCreatingCheckout}
              >
                <Button disabled={isCreatingCheckout}>
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Checkout...
                    </>
                  ) : (
                    'Start Checkout Procedure'
                  )}
                </Button>
              </CheckoutProcedureDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Checkout Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Checkout in Progress</span>
                  <Button 
                    onClick={completeCheckout}
                    disabled={!canCompleteCheckout()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Checkout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {checkoutReport.reportInfo?.checkoutDate && (
                    <div>
                      <span className="text-gray-600">Checkout Date:</span>
                      <p className="font-medium">
                        {new Date(checkoutReport.reportInfo.checkoutDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {checkoutReport.reportInfo?.clerk && (
                    <div>
                      <span className="text-gray-600">Clerk:</span>
                      <p className="font-medium">{checkoutReport.reportInfo.clerk}</p>
                    </div>
                  )}
                  {checkoutReport.reportInfo?.tenantName && (
                    <div>
                      <span className="text-gray-600">Tenant:</span>
                      <p className="font-medium">{checkoutReport.reportInfo.tenantName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Tenant Present:</span>
                    <p className="font-medium">
                      {checkoutReport.reportInfo?.tenantPresent ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Component Comparisons */}
            {isLoadingComparisons ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p>Loading component comparisons...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Component Comparisons</h2>
                {comparisons.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600">No components to review.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {comparisons.map(comparison => (
                      <CheckoutComparisonCard
                        key={comparison.id}
                        comparison={comparison}
                        originalComponent={getOriginalComponent(comparison.component_id)}
                        onUpdate={updateComparison}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
