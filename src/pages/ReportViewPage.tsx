import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import RoomSectionView from "@/components/RoomSectionView";
import { PDFGenerationAPI, PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { BookCheck, Download, FileText, Home, Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";

const ReportViewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const currentRoom = report?.rooms.find(room => room.id === currentRoomId) || null;
  
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
          navigate("/reports");
          return;
        }
        
        setReport(reportData);
        
        if (reportData.rooms.length > 0 && !currentRoomId) {
          setCurrentRoomId(reportData.rooms[0].id);
        }
        
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
  }, [reportId, currentRoomId, toast, navigate]);
  
  const handleGeneratePDF = async () => {
    if (!report) return;
    
    setIsGeneratingPDF(true);
    
    try {
      await PDFGenerationAPI.generatePDF(report.id);
      
      toast({
        title: "PDF Generated",
        description: "Your report PDF has been generated and is ready to download.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-500">Draft</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatReportType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          onClick={() => navigate("/reports")}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Back to Reports
        </Button>
      </div>
    );
  }
  
  return (
    <div className="shareai-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-shareai-blue">
              {formatReportType(report.type)} Report
            </h1>
            {getStatusBadge(report.status)}
          </div>
          <p className="text-gray-600">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {report.status !== "completed" && (
            <Button 
              onClick={() => navigate(`/reports/${report.id}/edit`)}
              className="bg-shareai-teal hover:bg-shareai-teal/90"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Report
            </Button>
          )}
          
          <Button 
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF || report.status !== "completed"}
            variant={report.status === "completed" ? "default" : "outline"}
            className={report.status === "completed" ? "bg-shareai-orange hover:bg-shareai-orange/90" : ""}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Report Type</p>
              <p className="font-medium">{formatReportType(report.type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created On</p>
              <p className="font-medium">{format(new Date(report.createdAt), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{report.createdBy}</p>
            </div>
            {report.completedAt && (
              <div>
                <p className="text-sm text-gray-500">Completed On</p>
                <p className="font-medium">{format(new Date(report.completedAt), 'MMMM d, yyyy')}</p>
              </div>
            )}
            {report.reviewedBy && (
              <div>
                <p className="text-sm text-gray-500">Reviewed By</p>
                <p className="font-medium">{report.reviewedBy}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Rooms Documented</p>
              <p className="font-medium">{report.rooms.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Home className="h-5 w-5 mr-2 text-shareai-teal" />
                Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              {report.rooms.length === 0 ? (
                <p className="text-gray-500 text-sm">No rooms have been added to this report.</p>
              ) : (
                <ul className="space-y-2">
                  {report.rooms.map((room) => (
                    <li key={room.id}>
                      <Button
                        variant={currentRoomId === room.id ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          currentRoomId === room.id 
                            ? "bg-shareai-teal hover:bg-shareai-teal/90" 
                            : ""
                        }`}
                        onClick={() => setCurrentRoomId(room.id)}
                      >
                        {room.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-shareai-teal" />
                Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2 text-sm">
                {report.disclaimers.map((disclaimer, index) => (
                  <li key={index} className="text-gray-600">
                    • {disclaimer}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {currentRoom ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{currentRoom.name}</CardTitle>
                </div>
                <p className="text-gray-600">
                  {currentRoom.generalCondition}
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Room Details</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="pt-2">
                    <div className="space-y-6">
                      {currentRoom.sections.map((section) => (
                        <RoomSectionView 
                          key={section.id} 
                          section={section}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="photos" className="pt-2">
                    {currentRoom.images.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentRoom.images.map((image) => (
                          <div key={image.id} className="relative rounded-lg overflow-hidden border">
                            <img 
                              src={image.url} 
                              alt={`${currentRoom.name}`} 
                              className="w-full h-64 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                              {format(new Date(image.timestamp), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No photos available for this room.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookCheck className="h-16 w-16 text-shareai-teal mb-4" />
                <h3 className="text-xl font-medium mb-2">No Room Selected</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  {report.rooms.length === 0 
                    ? "No rooms have been added to this report yet." 
                    : "Select a room from the list on the left to view its details."}
                </p>
                
                {report.status !== "completed" && (
                  <Button 
                    onClick={() => navigate(`/reports/${report.id}/edit`)}
                    className="bg-shareai-teal hover:bg-shareai-teal/90"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Report
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          
          {report.generalNotes && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">General Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={report.generalNotes} 
                  readOnly 
                  className="min-h-[100px] bg-gray-50"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewPage;
