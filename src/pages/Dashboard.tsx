
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import ReportCard from "@/components/ReportCard";
import { useMigration } from "@/hooks/useMigration";
import { useDashboardData } from "@/hooks/useDashboardData";

// Skeleton components for loading states
const PropertyCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="h-40 bg-gray-200 animate-pulse"></div>
    <CardHeader className="pb-2">
      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </CardHeader>
    <CardContent className="text-sm pb-2">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
      </div>
    </CardContent>
  </Card>
);

const ReportCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </CardHeader>
    <CardContent>
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { isMigrating } = useMigration();
  
  // Use optimized dashboard data hook
  const { 
    properties, 
    reports, 
    isLoading: isLoadingData, 
    error: dataError,
    refetch 
  } = useDashboardData();

  // Skip migration check for performance
  const isLoading = isMigrating || isLoadingData;

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

          {/* Recent Activity */}
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
              ) : dataError ? (
                <div className="text-center">
                  <p className="text-red-500 text-sm mb-2">{dataError}</p>
                  <Button size="sm" onClick={refetch}>Try Again</Button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center">
                        <span>Report created for {report.property?.name || 'Property'}</span>
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Properties</h2>
            <Button variant="outline" onClick={() => navigate("/properties")}>
              View All
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : dataError ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-red-500 mb-4">{dataError}</p>
                <Button onClick={refetch}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first property to begin creating inspection reports.
                </p>
                <Button onClick={() => navigate("/properties/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Reports</h2>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              View All
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <ReportCardSkeleton key={i} />
              ))}
            </div>
          ) : dataError ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-red-500 mb-4">{dataError}</p>
                <Button onClick={refetch}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
