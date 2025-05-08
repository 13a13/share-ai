
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI } from "@/lib/api";
import { Report } from "@/types";
import { useNavigate } from "react-router-dom";

export type ReportInfoFormValues = {
  reportDate: string;
  clerk: string;
  inventoryType: string;
  tenantPresent: boolean;
  tenantName: string;
  additionalInfo: string;
};

/**
 * Hook for managing report information and status
 */
export const useReportInfo = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveReportInfo = async (values: ReportInfoFormValues) => {
    if (!report) return;
    
    setIsSaving(true);
    
    try {
      console.log("Saving report info with values:", values);
      
      const updatedReport = await ReportsAPI.update(report.id, {
        reportInfo: {
          ...report.reportInfo,
          reportDate: values.reportDate, 
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

  return {
    isSaving,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
  };
};
