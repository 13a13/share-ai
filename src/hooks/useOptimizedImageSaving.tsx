
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { BatchReportsAPI } from "@/lib/api/reports/batchOperationsApi";

interface ComponentUpdate {
  id: string;
  images: string[];
  description: string;
  condition: any;
  analysisData: any;
}

export const useOptimizedImageSaving = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveComponentAnalysisBatch = async (
    reportId: string,
    componentUpdates: ComponentUpdate[]
  ): Promise<boolean> => {
    if (isSaving) return false;
    
    setIsSaving(true);
    
    try {
      // Batch all component updates into a single API call
      const success = await BatchReportsAPI.updateReportBatch(reportId, {
        components: componentUpdates
      });
      
      if (success) {
        toast({
          title: "Analysis Saved",
          description: `Successfully saved analysis for ${componentUpdates.length} component(s)`,
        });
        return true;
      } else {
        throw new Error("Failed to save analysis");
      }
    } catch (error) {
      console.error("Error saving component analysis:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save image analysis. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveComponentAnalysisBatch,
    isSaving
  };
};
