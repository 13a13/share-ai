
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import { PropertiesAPI } from "@/lib/api";
import { Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import PropertyLimitWarning from "@/components/PropertyLimitWarning";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { canCreateNewProperty, refetch: refetchLimits } = usePropertyLimits();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const data = await PropertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load properties. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      await PropertiesAPI.delete(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      refetchLimits(); // Refresh property count
      toast({
        title: "Success",
        description: "Property deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete property. Please try again.",
      });
    }
  };

  const handleCreateProperty = () => {
    if (!canCreateNewProperty()) {
      toast({
        variant: "destructive",
        title: "Property Limit Reached",
        description: "You've reached your property limit. Upgrade your subscription to create more properties.",
      });
      return;
    }
    navigate("/properties/new");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verifyvision-teal"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
                <p className="text-gray-600">Manage your property portfolio and create inspection reports.</p>
              </div>
              <Button 
                onClick={handleCreateProperty}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
                disabled={!canCreateNewProperty()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>
          </div>
        </div>

        <PropertyLimitWarning />

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">
                Start building your property portfolio by adding your first property.
              </p>
              <Button 
                onClick={handleCreateProperty}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
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
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onDeleteClick={handleDeleteProperty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
