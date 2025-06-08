
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
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
      
      // Fetch both properties and reports in parallel
      const [propertiesData, reportsData] = await Promise.all([
        PropertiesAPI.getAll(),
        ReportsAPI.getAll()
      ]);
      
      // Limit to recent items for dashboard
      const recentProperties = propertiesData.slice(0, 3);
      const recentReports = reportsData.slice(0, 3);
      
      setProperties(recentProperties);
      setReports(recentReports);
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
