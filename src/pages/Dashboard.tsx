
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import ReportCard from "@/components/ReportCard";
import EmptyState from "@/components/EmptyState";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property, Report } from "@/types";
import { useEffect, useState } from "react";
import { Home, FileText, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get properties
        const propertiesData = await PropertiesAPI.getAll();
        setProperties(propertiesData);
        
        // Get reports
        const reportsData = await ReportsAPI.getAll();
        
        // Sort by date and take the 3 most recent
        const sortedReports = reportsData.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ).slice(0, 3);
        
        // Add property address to reports
        const reportsWithAddresses = await Promise.all(
          sortedReports.map(async (report) => {
            const property = await PropertiesAPI.getById(report.propertyId);
            return {
              ...report,
              property,
            };
          })
        );
        
        setRecentReports(reportsWithAddresses);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="shareai-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-shareai-blue">Welcome to Share.AI</h1>
        <Button 
          onClick={() => navigate("/reports/new")}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Properties Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center">
                <Home className="h-6 w-6 mr-2 text-shareai-teal" />
                Properties
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/properties")}
              >
                View All
              </Button>
            </div>
            
            {properties.length === 0 ? (
              <EmptyState
                title="No properties yet"
                description="Add your first property to get started with creating reports."
                actionLabel="Add Property"
                onAction={() => navigate("/properties/new")}
                icon={<Home className="h-12 w-12 text-shareai-teal mb-4" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.slice(0, 3).map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>
          
          {/* Recent Reports Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center">
                <FileText className="h-6 w-6 mr-2 text-shareai-teal" />
                Recent Reports
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/reports")}
              >
                View All
              </Button>
            </div>
            
            {recentReports.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Start creating detailed property reports with AI-powered analysis."
                actionLabel="Create Report"
                onAction={() => navigate("/reports/new")}
                icon={<FileText className="h-12 w-12 text-shareai-teal mb-4" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReports.map((report) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    propertyAddress={report.property?.address}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
