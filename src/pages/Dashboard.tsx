
import { useEffect, useState } from "react";
import { PropertiesAPI } from "@/lib/api";
import { Property } from "@/types";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await PropertiesAPI.getAll();
        setProperties(data);
        setFilteredProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProperties(properties);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(
      (property) => 
        (property.name && property.name.toLowerCase().includes(query)) ||
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.state.toLowerCase().includes(query) ||
        property.zipCode.toLowerCase().includes(query)
    );
    
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);
  
  return (
    <div className="shareai-container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-shareai-blue">Welcome, {user?.name || user?.email?.split('@')[0]}</h1>
          <p className="text-gray-600">Manage your property inventory reports efficiently with Share.AI</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search properties..."
              className="pl-8 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => navigate("/properties/new")}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        searchQuery ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No matching properties</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <EmptyState
            title="No properties yet"
            description="Add your first property to get started with creating reports."
            actionLabel="Add Property"
            onAction={() => navigate("/properties/new")}
            icon={<Home className="h-12 w-12 text-shareai-teal mb-4" />}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
