
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report, Room, RoomSection, RoomType, RoomComponent } from "@/types";
import { BookCheck, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import components
import ReportHeader from "@/components/ReportHeader";
import ReportInfoForm, { ReportInfoFormValues } from "@/components/ReportInfoForm";
import EditableRoomSection from "@/components/EditableRoomSection";

const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().min(1, "Room type is required"),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

const ReportEditPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "living_room",
    },
  });
  
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
        
        toast({
          title: "Room Added",
          description: `${newRoom.name} has been added to the report with default components.`,
        });
        
        roomForm.reset({
          name: "",
          type: "living_room",
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
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => room.id === roomId);
    if (!currentRoom) return;
    
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
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => 
      room.sections.some(section => section.id === updatedSection.id)
    );
    
    if (!currentRoom) return;
    
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
  
  const handleUpdateComponents = async (roomId: string, updatedComponents: RoomComponent[]) => {
    if (!report) return;
    
    const currentRoom = report.rooms.find(room => room.id === roomId);
    if (!currentRoom) return;
    
    try {
      const updatedRoom = {
        ...currentRoom,
        components: updatedComponents,
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
      console.error("Error updating components:", error);
      toast({
        title: "Error",
        description: "Failed to update components. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    if (!report) return;
    
    try {
      await ReportsAPI.deleteRoom(report.id, roomId);
      
      setReport(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rooms: prev.rooms.filter(room => room.id !== roomId),
        };
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
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
  
  const roomTypeOptions = [
    { value: "entrance", label: "Entrance" },
    { value: "hallway", label: "Hallway" },
    { value: "living_room", label: "Living Room" },
    { value: "dining_room", label: "Dining Room" },
    { value: "kitchen", label: "Kitchen" },
    { value: "bedroom", label: "Bedroom" },
    { value: "bathroom", label: "Bathroom" },
    { value: "garage", label: "Garage" },
    { value: "basement", label: "Basement" },
    { value: "attic", label: "Attic" },
    { value: "outdoor", label: "Outdoor Space" },
    { value: "other", label: "Other Room" },
  ];
  
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
      
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
        </div>
        
        {report.rooms.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookCheck className="h-16 w-16 text-shareai-teal mb-4" />
              <h3 className="text-xl font-medium mb-2">No Rooms Added</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Add rooms to your report to begin documenting property conditions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {report.rooms.map((room) => (
              <EditableRoomSection 
                key={room.id}
                reportId={report.id}
                room={room}
                onUpdateGeneralCondition={handleUpdateGeneralCondition}
                onSaveSection={handleSaveSection}
                onUpdateComponents={handleUpdateComponents}
                onDeleteRoom={handleDeleteRoom}
              />
            ))}
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(handleAddRoom)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={roomForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Master Bedroom" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={roomForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roomTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-shareai-teal hover:bg-shareai-teal/90"
                  disabled={isSubmittingRoom}
                >
                  {isSubmittingRoom ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Room...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportEditPage;
