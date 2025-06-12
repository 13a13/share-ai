
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReportViewHeader from "@/components/report/ReportViewHeader";
import ReportStatusBanner from "@/components/report/ReportStatusBanner";
import ReportInformation from "@/components/report/ReportInformation";
import ReportRoomsSection from "@/components/report/ReportRoomsSection";
import ReportDisclaimers from "@/components/report/ReportDisclaimers";

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
        <ReportViewHeader 
          report={report}
          property={property}
          canStartCheckout={canStartCheckout}
        />

        <ReportStatusBanner 
          report={report}
          canStartCheckout={canStartCheckout}
        />
        
        <ReportInformation report={report} />
        
        <ReportRoomsSection 
          report={report}
          activeRoomIndex={activeRoomIndex}
          onNavigateRoom={handleNavigateRoom}
        />
        
        <ReportDisclaimers report={report} />
      </div>
      <Footer />
    </div>
  );
};

export default ReportViewPage;
