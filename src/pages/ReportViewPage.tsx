
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Download, Eye, CheckSquare } from "lucide-react";
import CollapsibleRoomSection from "@/components/CollapsibleRoomSection";
import PDFExportButton from "@/components/PDFExportButton";
import CheckoutButton from "@/components/CheckoutButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ReportViewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  
  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportId) return;
      
      try {
        console.log("Fetching report data for ID:", reportId);
        const reportData = await ReportsAPI.getById(reportId);
        if (!reportData) {
          toast({
            title: "Report not found",
            description: "The requested report could not be found.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        console.log("Report data loaded:", reportData);
        console.log("Report type:", reportData.type, "Status:", reportData.status);
        setReport(reportData);
        
        const propertyData = await PropertiesAPI.getById(reportData.propertyId);
        console.log("Property data loaded:", propertyData);
        setProperty(propertyData);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId, toast, navigate]);
  
  const handleNavigateRoom = (index: number) => {
    if (index >= 0 && index < (report?.rooms.length || 0)) {
      setActiveRoomIndex(index);
    }
  };

  // Check if this is a check-in report that can have a checkout
  const canStartCheckout = report && (
    report.type === 'check_in' || 
    report.type === 'checkin' || 
    !report.type || 
    report.type.includes('check')
  ) && (
    report.status === 'completed' || 
    report.status === 'pending_review'
  );
  
  console.log("Checkout eligibility:", { 
    reportType: report?.type, 
    reportStatus: report?.status, 
    canStartCheckout 
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="shareai-container flex justify-center items-center min-h-[50vh] flex-1">
          <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!report || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="shareai-container text-center py-12 flex-1">
          <h2 className="text-2xl font-bold mb-4 text-shareai-blue">Report Not Found</h2>
          <p className="mb-6">The requested report could not be found or has been deleted.</p>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            Back to Dashboard
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="shareai-container py-8 flex-1">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-shareai-blue">
              {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
            </h1>
            <p className="text-gray-600">
              {property.address}, {property.city}, {property.state} {property.zipCode}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">
                Status: <span className="font-medium">{report.status}</span>
              </span>
              <span className="text-sm text-gray-500">
                Type: <span className="font-medium">{report.type}</span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/properties/${property.id}`)}
              className="border-shareai-blue text-shareai-blue hover:bg-shareai-teal hover:text-white"
            >
              Back to Property
            </Button>
            <Button 
              onClick={() => navigate(`/reports/${reportId}/edit`)}
              className="bg-shareai-teal hover:bg-shareai-teal/90 text-white px-6"
            >
              <Eye className="h-4 w-4 mr-2" />
              Edit Report
            </Button>
            {canStartCheckout && (
              <CheckoutButton 
                report={report}
                className="border-shareai-teal text-shareai-teal hover:bg-shareai-teal hover:text-white px-6"
              />
            )}
            <PDFExportButton 
              report={report} 
              property={property} 
              directDownload={false}
            />
          </div>
        </div>

        {/* Add checkout status info if applicable */}
        {canStartCheckout && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Ready for Checkout</h3>
                <p className="text-blue-700 text-sm">
                  This completed check-in report can be used to create a checkout assessment.
                </p>
              </div>
              <CheckoutButton 
                report={report}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              />
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-shareai-blue">Report Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Report Date</p>
                <p>{report.reportInfo?.reportDate ? new Date(report.reportInfo.reportDate).toLocaleDateString() : "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Report Type</p>
                <p>{report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inspector</p>
                <p>{report.reportInfo?.clerk || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>{report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              {report.reportInfo?.tenantName && (
                <div>
                  <p className="text-sm text-gray-500">Tenant</p>
                  <p>{report.reportInfo.tenantName}</p>
                </div>
              )}
            </div>
            
            {report.reportInfo?.additionalInfo && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Additional Information</p>
                <p>{report.reportInfo.additionalInfo}</p>
              </div>
            )}
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-4 text-shareai-blue">Rooms</h2>
        
        {report.rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No rooms have been added to this report.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {report.rooms.map((room, index) => (
              <CollapsibleRoomSection 
                key={room.id} 
                room={room} 
                roomIndex={index}
                totalRooms={report.rooms.length}
                onNavigateRoom={handleNavigateRoom}
                isComplete={room.components?.filter(c => !c.isOptional).every(c => 
                  c.description && c.condition && (c.images.length > 0 || c.notes)
                )}
              />
            ))}
          </div>
        )}
        
        {report.disclaimers && report.disclaimers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-bold mb-4 text-shareai-blue">Disclaimers</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {report.disclaimers.map((disclaimer, index) => (
                <li key={index}>{disclaimer}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ReportViewPage;
