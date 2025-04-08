
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report, Room, RoomSection, RoomType, RoomComponent } from "@/types";
import { BookCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

// Import our new components
import ReportHeader from "@/components/ReportHeader";
import ReportInfoForm, { ReportInfoFormValues } from "@/components/ReportInfoForm";
import RoomList, { RoomFormValues } from "@/components/RoomList";
import RoomDetails from "@/components/RoomDetails";

const ReportEditPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  
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
  
  const createDefaultComponent = (name: string, type: string, isOptional: boolean): RoomComponent => {
    return {
      id: uuidv4(),
      name,
      type,
      description: "",
      condition: "fair",
      notes: "",
      images: [],
      isOptional,
    };
  };
  
  const handleAddRoom = async (values: RoomFormValues) => {
    if (!report) return;
    
    setIsSubmittingRoom(true);
    
    try {
      const newRoom = await ReportsAPI.addRoom(
        report.id,
        values.name,
        values.type as RoomType
      );
      
      if (newRoom) {
        let initialComponents: RoomComponent[] = [];
        
        if (values.type === "bathroom") {
          initialComponents = [
            createDefaultComponent("Walls", "walls", false),
            createDefaultComponent("Ceiling", "ceiling", false),
            createDefaultComponent("Flooring", "flooring", false),
            createDefaultComponent("Doors & Frames", "doors", false),
            createDefaultComponent("Bath/Shower", "bath", false),
            createDefaultComponent("Toilet", "toilet", false),
          ];
        } else if (values.type === "kitchen") {
          initialComponents = [
            createDefaultComponent("Walls", "walls", false),
            createDefaultComponent("Ceiling", "ceiling", false),
            createDefaultComponent("Flooring", "flooring", false),
            createDefaultComponent("Cabinetry & Countertops", "cabinetry", false),
            createDefaultComponent("Sink & Taps", "sink", false),
          ];
        } else {
          initialComponents = [
            createDefaultComponent("Walls", "walls", false),
            createDefaultComponent("Ceiling", "ceiling", false),
            createDefaultComponent("Flooring", "flooring", false),
            createDefaultComponent("Doors & Frames", "doors", false),
          ];
        }
        
        const updatedRoom = {
          ...newRoom,
          components: initialComponents,
        };
        
        await ReportsAPI.updateRoom(report.id, newRoom.id, updatedRoom);
        
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: [...prev.rooms.filter(r => r.id !== newRoom.id), updatedRoom],
          };
        });
        
        setCurrentRoomId(newRoom.id);
        
        toast({
          title: "Room Added",
          description: `${newRoom.name} has been added to the report with default components.`,
        });
      }
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRoom(false);
    }
  };
  
  const handleUpdateGeneralCondition = async (roomId: string, generalCondition: string) => {
    if (!report || !currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        generalCondition,
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, roomId, updatedRoom);
      
      if (savedRoom) {
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(room => 
              room.id === savedRoom.id ? savedRoom : room
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error saving general condition:", error);
      toast({
        title: "Error",
        description: "Failed to save general condition. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveSection = async (updatedSection: RoomSection) => {
    if (!report || !currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        sections: currentRoom.sections.map(section => 
          section.id === updatedSection.id ? updatedSection : section
        ),
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom);
      
      if (savedRoom) {
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(room => 
              room.id === savedRoom.id ? savedRoom : room
            ),
          };
        });
        
        toast({
          title: "Section Saved",
          description: "Section has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving section:", error);
      toast({
        title: "Error",
        description: "Failed to save section. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateComponents = async (updatedComponents: RoomComponent[]) => {
    if (!report || !currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        components: updatedComponents,
      };
      
      const savedRoom = await ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom);
      
      if (savedRoom) {
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(room => 
              room.id === savedRoom.id ? savedRoom : room
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error updating components:", error);
      toast({
        title: "Error",
        description: "Failed to update components. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveReportInfo = async (values: ReportInfoFormValues) => {
    if (!report) return;
    
    setIsSaving(true);
    
    try {
      const updatedReport = await ReportsAPI.update(report.id, {
        reportInfo: {
          reportDate: new Date(values.reportDate),
          clerk: values.clerk,
          inventoryType: values.inventoryType,
          tenantPresent: values.tenantPresent || false,
          tenantName: values.tenantName,
          additionalInfo: values.additionalInfo,
        },
      });
      
      if (updatedReport) {
        setReport(updatedReport);
        
        toast({
          title: "Report Info Saved",
          description: "Report information has been saved successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving report info:", error);
      toast({
        title: "Error",
        description: "Failed to save report information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveReport = async () => {
    if (!report) return;
    
    setIsSaving(true);
    
    try {
      let updatedStatus = report.status;
      
      if (updatedStatus === "draft") {
        updatedStatus = "in_progress";
      }
      
      const hasRoomsWithImages = report.rooms.some(room => 
        room.images.length > 0 || (room.components && room.components.some(comp => comp.images.length > 0))
      );
      if (hasRoomsWithImages && updatedStatus === "in_progress") {
        updatedStatus = "pending_review";
      }
      
      const updatedReport = await ReportsAPI.update(report.id, {
        status: updatedStatus,
      });
      
      if (updatedReport) {
        setReport(updatedReport);
        
        toast({
          title: "Report Saved",
          description: "Your report has been saved successfully.",
        });
        
        navigate(`/reports/${report.id}`);
      }
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCompleteReport = async () => {
    if (!report) return;
    
    setIsSaving(true);
    
    try {
      const updatedReport = await ReportsAPI.update(report.id, {
        status: "completed",
        completedAt: new Date(),
      });
      
      if (updatedReport) {
        setReport(updatedReport);
        
        toast({
          title: "Report Completed",
          description: "Your report has been marked as completed.",
        });
        
        navigate(`/reports/${report.id}`);
      }
    } catch (error) {
      console.error("Error completing report:", error);
      toast({
        title: "Error",
        description: "Failed to complete report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageProcessed = (updatedRoom: Room) => {
    setReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rooms: prev.rooms.map(room => 
          room.id === updatedRoom.id ? updatedRoom : room
        ),
      };
    });
    
    toast({
      title: "Image Processed",
      description: "AI has analyzed the image and updated the room details.",
    });
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
  
  // Prepare the report info form default values
  const reportInfoDefaults: ReportInfoFormValues = {
    reportDate: report.reportInfo?.reportDate 
      ? new Date(report.reportInfo.reportDate).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10),
    clerk: report.reportInfo?.clerk || "Inspector",
    inventoryType: report.reportInfo?.inventoryType || "Full Inventory",
    tenantPresent: report.reportInfo?.tenantPresent || false,
    tenantName: report.reportInfo?.tenantName || "",
    additionalInfo: report.reportInfo?.additionalInfo || "",
  };
  
  return (
    <div className="shareai-container">
      <ReportHeader 
        title={report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + " Report"}
        address={`${property.address}, ${property.city}, ${property.state} ${property.zipCode}`}
        status={report.status}
        isSaving={isSaving}
        onSave={handleSaveReport}
        onComplete={handleCompleteReport}
      />
      
      <ReportInfoForm 
        defaultValues={reportInfoDefaults}
        onSave={handleSaveReportInfo}
        isSaving={isSaving}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RoomList 
            rooms={report.rooms}
            currentRoomId={currentRoomId}
            onSelectRoom={setCurrentRoomId}
            onAddRoom={handleAddRoom}
            isSubmittingRoom={isSubmittingRoom}
          />
        </div>
        
        <div className="lg:col-span-3">
          <RoomDetails 
            reportId={report.id}
            room={currentRoom}
            onUpdateGeneralCondition={handleUpdateGeneralCondition}
            onSaveSection={handleSaveSection}
            onUpdateComponents={handleUpdateComponents}
            onImageProcessed={handleImageProcessed}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportEditPage;
