
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import RoomImageUploader from "@/components/RoomImageUploader";
import RoomSectionEditor from "@/components/RoomSectionEditor";
import RoomComponentInspection from "@/components/RoomComponentInspection";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report, Room, RoomSection, RoomType, RoomComponent } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCheck, FileCheck, Home, Loader2, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().min(1, "Room type is required"),
});

const reportInfoSchema = z.object({
  reportDate: z.string().min(1, "Report date is required"),
  clerk: z.string().min(1, "Clerk/agent name is required"),
  inventoryType: z.string().min(1, "Inventory type is required"),
  tenantPresent: z.boolean().optional(),
  tenantName: z.string().optional(),
  additionalInfo: z.string().optional(),
});

const ReportEditPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  
  const roomForm = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "living_room",
    },
  });

  const reportInfoForm = useForm<z.infer<typeof reportInfoSchema>>({
    resolver: zodResolver(reportInfoSchema),
    defaultValues: {
      reportDate: new Date().toISOString().substring(0, 10),
      clerk: "Inspector",
      inventoryType: "Full Inventory",
      tenantPresent: false,
      tenantName: "",
      additionalInfo: "",
    },
  });
  
  // Get the current room from the report
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
        
        // Initialize reportInfo form if data exists
        if (reportData.reportInfo) {
          reportInfoForm.reset({
            reportDate: new Date(reportData.reportInfo.reportDate).toISOString().substring(0, 10),
            clerk: reportData.reportInfo.clerk,
            inventoryType: reportData.reportInfo.inventoryType,
            tenantPresent: reportData.reportInfo.tenantPresent,
            tenantName: reportData.reportInfo.tenantName || "",
            additionalInfo: reportData.reportInfo.additionalInfo || "",
          });
        }
        
        setReport(reportData);
        
        // Set the current room to the first room if available
        if (reportData.rooms.length > 0 && !currentRoomId) {
          setCurrentRoomId(reportData.rooms[0].id);
        }
        
        // Fetch property data
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
  }, [reportId, currentRoomId, toast, navigate, reportInfoForm]);
  
  const handleAddRoom = async (values: z.infer<typeof roomFormSchema>) => {
    if (!report) return;
    
    setIsSubmittingRoom(true);
    
    try {
      const newRoom = await ReportsAPI.addRoom(
        report.id,
        values.name,
        values.type as RoomType
      );
      
      if (newRoom) {
        // Initialize default components if type is bathroom or kitchen
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
        
        // Add components to the new room
        const updatedRoom = {
          ...newRoom,
          components: initialComponents,
        };
        
        // Save the updated room
        await ReportsAPI.updateRoom(report.id, newRoom.id, updatedRoom);
        
        // Update the report state
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: [...prev.rooms.filter(r => r.id !== newRoom.id), updatedRoom],
          };
        });
        
        // Set the current room to the new room
        setCurrentRoomId(newRoom.id);
        
        // Reset the form
        roomForm.reset({
          name: "",
          type: "living_room",
        });
        
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
  
  const handleSaveSection = async (updatedSection: RoomSection) => {
    if (!report || !currentRoom) return;
    
    try {
      // Update the sections in the current room
      const updatedRoom = {
        ...currentRoom,
        sections: currentRoom.sections.map(section => 
          section.id === updatedSection.id ? updatedSection : section
        ),
      };
      
      // Save the updated room
      const savedRoom = await ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom);
      
      if (savedRoom) {
        // Update the report state
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
      // Update the components in the current room
      const updatedRoom = {
        ...currentRoom,
        components: updatedComponents,
      };
      
      // Save the updated room
      const savedRoom = await ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom);
      
      if (savedRoom) {
        // Update the report state
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
  
  const handleSaveReportInfo = async (values: z.infer<typeof reportInfoSchema>) => {
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
      // Update report status based on the current state
      let updatedStatus = report.status;
      
      // If the report is a draft, move it to in_progress
      if (updatedStatus === "draft") {
        updatedStatus = "in_progress";
      }
      
      // If there's at least one room with images, move to pending_review
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
        
        // Navigate to the report view page
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
        
        // Navigate to the report view page
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
    // Update the report state
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
  
  return (
    <div className="shareai-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-shareai-blue">
            {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
          </h1>
          <p className="text-gray-600">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/reports/${report.id}`)}
          >
            Cancel
          </Button>
          {report.status === "pending_review" ? (
            <Button 
              onClick={handleCompleteReport}
              disabled={isSaving}
              className="bg-shareai-teal hover:bg-shareai-teal/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Complete Report
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleSaveReport}
              disabled={isSaving}
              className="bg-shareai-teal hover:bg-shareai-teal/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Report Info Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...reportInfoForm}>
            <form onSubmit={reportInfoForm.handleSubmit(handleSaveReportInfo)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={reportInfoForm.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reportInfoForm.control}
                  name="clerk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clerk/Agent</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter clerk/agent name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reportInfoForm.control}
                  name="inventoryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inventory type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full Inventory">Full Inventory</SelectItem>
                          <SelectItem value="Check-In">Check-In</SelectItem>
                          <SelectItem value="Check-Out">Check-Out</SelectItem>
                          <SelectItem value="Mid-Term">Mid-Term Inspection</SelectItem>
                          <SelectItem value="Interim">Interim Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reportInfoForm.control}
                  name="tenantPresent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-shareai-teal focus:ring-shareai-teal"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Tenant Present at Inspection
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                {reportInfoForm.watch("tenantPresent") && (
                  <FormField
                    control={reportInfoForm.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tenant name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={reportInfoForm.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional information about this report" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-shareai-teal hover:bg-shareai-teal/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Information"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Room List */}
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
                <p className="text-gray-500 text-sm">No rooms added yet.</p>
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
            <CardFooter className="pt-2">
              {/* Add Room Form */}
              <Form {...roomForm}>
                <form onSubmit={roomForm.handleSubmit(handleAddRoom)} className="w-full space-y-3">
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
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmittingRoom}
                  >
                    {isSubmittingRoom ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentRoom ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{currentRoom.name}</CardTitle>
                <p className="text-gray-600 text-sm">
                  {currentRoom.generalCondition}
                </p>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Room Details</TabsTrigger>
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="photos">Photos & AI Analysis</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="pt-2">
                    <div className="space-y-6">
                      {/* General Condition */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">General Condition</h3>
                        <Textarea 
                          value={currentRoom.generalCondition}
                          onChange={(e) => {
                            const updatedRoom = {
                              ...currentRoom,
                              generalCondition: e.target.value,
                            };
                            
                            // Save the updated room
                            ReportsAPI.updateRoom(report.id, currentRoom.id, updatedRoom)
                              .then((savedRoom) => {
                                if (savedRoom) {
                                  // Update the report state
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
                              })
                              .catch((error) => {
                                console.error("Error saving general condition:", error);
                                toast({
                                  title: "Error",
                                  description: "Failed to save general condition. Please try again.",
                                  variant: "destructive",
                                });
                              });
                          }}
                          placeholder="Describe the general condition of the room..."
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      {/* Room Sections */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Detailed Sections</h3>
                        
                        {currentRoom.sections.map((section) => (
                          <RoomSectionEditor 
                            key={section.id} 
                            section={section}
                            onSave={handleSaveSection}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="components" className="pt-2">
                    <RoomComponentInspection
                      reportId={report.id}
                      roomId={currentRoom.id}
                      roomType={currentRoom.type}
                      components={currentRoom.components || []}
                      onChange={handleUpdateComponents}
                    />
                  </TabsContent>
                  
                  <TabsContent value="photos" className="pt-2">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Room Photos</h3>
                      
                      {currentRoom.images.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {currentRoom.images.map((image) => (
                            <div key={image.id} className="relative rounded-lg overflow-hidden border">
                              <img 
                                src={image.url} 
                                alt={`${currentRoom.name}`} 
                                className="w-full h-64 object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className={image.aiProcessed ? "bg-green-500" : "bg-yellow-500"}>
                                  {image.aiProcessed ? "AI Processed" : "Not Processed"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <RoomImageUploader 
                        reportId={report.id}
                        roomId={currentRoom.id}
                        onImageProcessed={handleImageProcessed}
                      />
                    </div>
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
                    ? "Start by adding a room using the form on the left." 
                    : "Select a room from the list on the left to edit its details."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportEditPage;
