
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { OptimizedDashboardAPI } from "@/lib/api/reports/optimizedDashboardApi";
import { Property, Report } from "@/types";

interface DashboardData {
  properties: Property[];
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching optimized dashboard data...");
      
      // Single optimized API call
      const { properties: propertiesData, reports: reportsData } = await OptimizedDashboardAPI.getDashboardData();
      
      console.log(`Loaded ${propertiesData.length} properties and ${reportsData.length} reports`);
      
      setProperties(propertiesData);
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      const errorMessage = "Failed to load dashboard data. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    properties,
    reports,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
};
