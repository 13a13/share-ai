
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Property, Report } from "@/types";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyDetailsHeader from "@/components/property/PropertyDetailsHeader";
import PropertyInfoCard from "@/components/property/PropertyInfoCard";
import PropertyReportsCard from "@/components/property/PropertyReportsCard";
import { useNavigate } from "react-router-dom";

const PropertyDetailsPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId) return;
      
      try {
        setIsLoading(true);
        const propertyData = await PropertiesAPI.getById(propertyId);
        const reportsData = await ReportsAPI.getByPropertyId(propertyId);
        
        setProperty(propertyData);
        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load property details.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [propertyId, toast]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="verifyvision-container flex items-center justify-center py-12 flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-verifyvision-teal"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="verifyvision-container py-8 flex-1">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="text-gray-500 mb-4">The property you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="verifyvision-container py-8 flex-1">
        <PropertyDetailsHeader property={property} />
        
        <div className="space-y-6">
          <PropertyInfoCard 
            property={property} 
            onPropertyUpdate={setProperty}
          />
          
          <PropertyReportsCard 
            property={property}
            reports={reports}
            onReportsUpdate={setReports}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetailsPage;
