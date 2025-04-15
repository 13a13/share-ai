
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { PropertiesAPI } from "@/lib/api";
import { Property } from "@/types";
import { useEffect, useState } from "react";
import { Home, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PropertiesPage = () => {
  const navigate = useNavigate();
  const { toast: toastUI } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.state.toLowerCase().includes(query) ||
        property.zipCode.toLowerCase().includes(query)
    );
    
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);
  
  const handleDeleteClick = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await PropertiesAPI.delete(propertyToDelete);
      if (success) {
        // Update the properties state
        const updatedProperties = properties.filter(p => p.id !== propertyToDelete);
        setProperties(updatedProperties);
        setFilteredProperties(updatedProperties);
        
        // Show success message
        toast.success("Property deleted successfully");
      } else {
        throw new Error("Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toastUI({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete property. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };
  
  return (
    <div className="shareai-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-shareai-blue">Properties</h1>
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
            <PropertyCard 
              key={property.id} 
              property={property} 
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropertiesPage;
