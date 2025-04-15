
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";

/**
 * Hook for fetching and maintaining report data
 */
export const useReportData = (reportId: string | undefined) => {
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  return {
    report,
    setReport,
    property,
    isLoading,
    hasError
  };
};
