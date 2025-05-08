import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Download, Eye } from "lucide-react";
import CollapsibleRoomSection from "@/components/CollapsibleRoomSection";
import PDFExportButton from "@/components/PDFExportButton";

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
        const reportData = await ReportsAPI.getById(reportId);
        if (!reportData) {
          toast({
            title: "Report not found",
            description: "The requested report could not be found.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setReport(reportData);
        
        const propertyData = await PropertiesAPI.getById(reportData.propertyId);
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
  
  if (isLoading) {
    return (
      <div className="shareai-container flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
      </div>
    );
  }
  
  if (!report || !property) {
    return (
      <div className="shareai-container text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <p className="mb-6">The requested report could not be found or has been deleted.</p>
        <Button 
          onClick={() => navigate("/")}
          variant="warm"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="shareai-container">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-shareai-blue">
            {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
          </h1>
          <p className="text-gray-600">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/properties/${property.id}`)}
          >
            Back to Property
          </Button>
          <Button 
            onClick={() => navigate(`/reports/${reportId}/edit`)}
            variant="warm"
          >
            Edit Report
          </Button>
          <PDFExportButton 
            report={report} 
            property={property} 
            directDownload={false}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Report Information</h2>
          
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
      
      <h2 className="text-xl font-bold mb-4">Rooms</h2>
      
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
          <h2 className="text-xl font-bold mb-4">Disclaimers</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            {report.disclaimers.map((disclaimer, index) => (
              <li key={index}>{disclaimer}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportViewPage;
