
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report, Room, RoomSection, RoomType, RoomComponent } from "@/types";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

export type RoomFormValues = {
  name: string;
  type: string;
};

export type ReportInfoFormValues = {
  reportDate: string;
  clerk: string;
  inventoryType: string;
  tenantPresent: boolean;
  tenantName: string;
  additionalInfo: string;
};

export const useReportEditor = (reportId: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const reportData = await ReportsAPI.getById(reportId);
        if (!reportData) {
          toast({
            title: "Report not found",
            description: "The requested report could not be found.",
            variant: "destructive",
          });
          setHasError(true);
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
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId, toast]);
  
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
  
  const handleNavigateRoom = (index: number) => {
    if (index >= 0 && index < (report?.rooms.length || 0)) {
      setActiveRoomIndex(index);
    }
  };

  return {
    report,
    property,
    isLoading,
    isSaving,
    isSubmittingRoom,
    activeRoomIndex,
    hasError,
    handleAddRoom,
    handleUpdateGeneralCondition,
    handleSaveSection,
    handleUpdateComponents,
    handleDeleteRoom,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
    handleNavigateRoom,
  };
};
