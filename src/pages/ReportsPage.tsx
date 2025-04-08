
import { Button } from "@/components/ui/button";
import ReportCard from "@/components/ReportCard";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { useEffect, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
        
        <Select 
          value={statusFilter} 
          onValueChange={setStatusFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
