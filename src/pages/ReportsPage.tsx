
import { Button } from "@/components/ui/button";
import ReportCard from "@/components/ReportCard";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { useEffect, useState } from "react";
import { FileText, Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get properties for filtering
        const propertiesData = await PropertiesAPI.getAll();
        setProperties(propertiesData);
        
        // Get all reports
        const reportsData = await ReportsAPI.getAll();
        
        // Add property info to reports
        const reportsWithProperties = await Promise.all(
          reportsData.map(async (report) => {
            const property = propertiesData.find(p => p.id === report.propertyId);
            return {
              ...report,
              property,
            };
          })
        );
        
        // Sort by date (newest first)
        const sortedReports = reportsWithProperties.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setReports(sortedReports);
        setFilteredReports(sortedReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({
          title: "Error",
          description: "Failed to load reports. Please refresh the page to try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  useEffect(() => {
    let filtered = [...reports];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply property filter
    if (propertyFilter !== "all") {
      filtered = filtered.filter(report => report.propertyId === propertyFilter);
    }
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.property?.address.toLowerCase().includes(query) ||
        report.id.toLowerCase().includes(query)
      );
    }
    
    setFilteredReports(filtered);
  }, [statusFilter, propertyFilter, searchQuery, reports]);
  
  const handleDeleteReport = async (reportId: string) => {
    setIsProcessing(true);
    try {
      // Delete the report
      await ReportsAPI.delete(reportId);
      
      // Update local state
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      
      toast({
        title: "Report Deleted",
        description: "The report has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDuplicateReport = async (reportId: string) => {
    setIsProcessing(true);
    try {
      // Find the report to duplicate
      const reportToDuplicate = reports.find(report => report.id === reportId);
      
      if (!reportToDuplicate) {
        throw new Error("Report not found");
      }
      
      // Create a duplicate report
      const duplicatedReport = await ReportsAPI.duplicate(reportId);
      
      if (duplicatedReport) {
        // Add property info to the duplicated report
        const property = properties.find(p => p.id === duplicatedReport.propertyId);
        const reportWithProperty = {
          ...duplicatedReport,
          property,
        };
        
        // Update local state
        setReports(prevReports => [reportWithProperty, ...prevReports]);
        
        toast({
          title: "Report Duplicated",
          description: "Report has been duplicated successfully.",
        });
      }
    } catch (error) {
      console.error("Error duplicating report:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleArchiveReport = async (reportId: string) => {
    setIsProcessing(true);
    try {
      // Find the report to archive
      const reportToArchive = reports.find(report => report.id === reportId);
      
      if (!reportToArchive) {
        throw new Error("Report not found");
      }
      
      // Update the report with archived status
      const archivedReport = await ReportsAPI.update(reportId, {
        status: "archived",
      });
      
      if (archivedReport) {
        // Update local state
        setReports(prevReports => 
          prevReports.map(report => 
            report.id === reportId 
              ? { ...report, ...archivedReport } 
              : report
          )
        );
        
        toast({
          title: "Report Archived",
          description: "Report has been archived successfully.",
        });
      }
    } catch (error) {
      console.error("Error archiving report:", error);
      toast({
        title: "Error",
        description: "Failed to archive report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="shareai-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-shareai-blue">Reports</h1>
        <Button 
          onClick={() => navigate("/reports/new")}
          className="bg-shareai-teal hover:bg-shareai-teal/90 md:ml-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search reports..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="pl-8">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter reports by their current status</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Select 
          value={propertyFilter} 
          onValueChange={setPropertyFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        (searchQuery || statusFilter !== "all" || propertyFilter !== "all") ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No matching reports</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPropertyFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <EmptyState
            title="No reports yet"
            description="Create your first property report with AI-powered analysis."
            actionLabel="Create Report"
            onAction={() => navigate("/reports/new")}
            icon={<FileText className="h-12 w-12 text-shareai-teal mb-4" />}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              propertyAddress={report.property?.address}
              onDelete={handleDeleteReport}
              onDuplicate={handleDuplicateReport}
              onArchive={handleArchiveReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
