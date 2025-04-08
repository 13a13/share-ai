
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import RoomImageUploader from "@/components/RoomImageUploader";
import RoomSectionEditor from "@/components/RoomSectionEditor";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report, Room, RoomSection, RoomType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCheck, FileCheck, Home, Loader2, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.string().min(1, "Room type is required"),
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
  }, [reportId, currentRoomId, toast, navigate]);
  
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
        // Update the report state
        setReport(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: [...prev.rooms, newRoom],
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
          description: `${newRoom.name} has been added to the report.`,
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
      const hasRoomsWithImages = report.rooms.some(room => room.images.length > 0);
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
