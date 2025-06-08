
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ReportsAPI } from "@/lib/api";
import { Report } from "@/types";
import { useNavigate } from "react-router-dom";
import { useBatchRoomSaving } from "@/hooks/useBatchRoomSaving";
import { useUltraFastCompletion } from "@/hooks/useUltraFastCompletion";

export type ReportInfoFormValues = {
  reportDate: string;
  clerk: string;
  inventoryType: string;
  tenantPresent: boolean;
  tenantName: string;
  additionalInfo: string;
};

/**
 * Hook for managing report information with ultra-fast completion
 */
export const useReportInfo = (
  report: Report | null,
  setReport: React.Dispatch<React.SetStateAction<Report | null>>
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { saveBatch, saveProgress: batchProgress } = useBatchRoomSaving();
  const { completeReportInstantly, isCompleting, completionProgress } = useUltraFastCompletion();
  
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
        const completeReport = {
          ...updatedReport,
          rooms: report.rooms
        };
        
        setReport(completeReport);
        
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
    
    console.log("🚀 Starting batch save for report:", report.id);
    
    const success = await saveBatch(report);
    
    if (success) {
      console.log("Navigating to report view:", `/reports/${report.id}/view`);
      navigate(`/reports/${report.id}/view`);
    }
  };
  
  const handleCompleteReport = async () => {
    if (!report) return;
    
    console.log("🚀 Starting ultra-fast completion for report:", report.id);
    
    const success = await completeReportInstantly(report);
    
    if (success) {
      console.log("Navigating to completed report view:", `/reports/${report.id}/view`);
      navigate(`/reports/${report.id}/view`);
    }
  };

  return {
    isSaving: isSaving || isCompleting,
    saveProgress: completionProgress || batchProgress,
    handleSaveReportInfo,
    handleSaveReport,
    handleCompleteReport,
  };
};
