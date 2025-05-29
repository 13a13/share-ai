
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, FileText, Plus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import ReportCard from "@/components/ReportCard";
import { Property, Report } from "@/types";
import { useMigration } from "@/hooks/useMigration";
import TrialStatusCard from "@/components/TrialStatusCard";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";

const Dashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isMigrating } = useMigration();
  const { canCreateNewProperty } = usePropertyLimits();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        const [propertiesData, reportsData] = await Promise.all([
          PropertiesAPI.getAll(),
          ReportsAPI.getAll()
        ]);
        
        setProperties(propertiesData.slice(0, 3)); // Show only 3 recent properties
        setReports(reportsData.slice(0, 3)); // Show only 3 recent reports
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for migration to complete before fetching data
    if (!isMigrating) {
      fetchData();
    }
  }, [isMigrating]);

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verifyvision-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Setting up your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your properties.</p>
        </div>

        {/* Trial Status Card */}
        <div className="mb-8">
          <TrialStatusCard />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground">
                Active properties in your portfolio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                Inspection reports generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {properties.length > 0 ? Math.round((reports.length / properties.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Properties with completed reports
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your property inspections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                onClick={() => navigate("/properties/new")}
                disabled={!canCreateNewProperty()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Property
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/reports/new")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Create New Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest property and report updates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {reports.length > 0 ? (
                    reports.slice(0, 3).map((report) => (
                      <div key={report.id} className="flex justify-between items-center">
                        <span>Report created for {report.propertyName}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No recent activity</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Properties */}
        {properties.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Properties</h2>
              <Button variant="outline" onClick={() => navigate("/properties")}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Reports</h2>
              <Button variant="outline" onClick={() => navigate("/reports")}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {properties.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first property to begin creating inspection reports.
              </p>
              <Button 
                onClick={() => navigate("/properties/new")}
                disabled={!canCreateNewProperty()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
              {!canCreateNewProperty() && (
                <p className="text-sm text-red-600 mt-2">
                  Upgrade your subscription to create properties
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
