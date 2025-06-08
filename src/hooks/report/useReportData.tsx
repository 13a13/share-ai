
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { useReportCache } from "@/hooks/useReportCache";

/**
 * Hook for fetching and maintaining report data with caching
 */
export const useReportData = (reportId: string | undefined) => {
  const { toast } = useToast();
  const { getCachedReport, setCachedReport, updateCachedReport } = useReportCache();
  
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
        console.log(`Fetching report data for ID: ${reportId}`);
        
        // Check cache first
        const cached = getCachedReport(reportId);
        if (cached) {
          console.log("Using cached report data");
          setReport(cached.report);
          setProperty(cached.property);
          setIsLoading(false);
          return;
        }

        console.log("Cache miss, fetching from API");
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
        
        // Cache the results
        setCachedReport(reportId, reportData, propertyData);
        console.log("Report data cached successfully");
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
  }, [reportId, toast, getCachedReport, setCachedReport]);

  // Function to update report and cache
  const updateReport = (updatedReport: Report) => {
    setReport(updatedReport);
    if (reportId) {
      updateCachedReport(reportId, updatedReport);
    }
  };

  return {
    report,
    setReport: updateReport,
    property,
    isLoading,
    hasError
  };
};
