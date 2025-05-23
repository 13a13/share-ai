
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Edit, Save, Upload, Home } from "lucide-react";
import { Property } from "@/types";
import { PropertiesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface PropertyInfoCardProps {
  property: Property;
  onPropertyUpdate: (updatedProperty: Property) => void;
}

const PropertyInfoCard = ({ property, onPropertyUpdate }: PropertyInfoCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({
    name: property.name || '',
    address: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    yearBuilt: property.yearBuilt
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = property.imageUrl;
      
      if (imageFile) {
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(imageFile);
        });
      }
      
      const updatedProperty = await PropertiesAPI.update(property.id, {
        ...formData,
        imageUrl
      });
      
      if (updatedProperty) {
        onPropertyUpdate(updatedProperty);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Property details updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update property details.",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-xl">
          <Building2 className="h-5 w-5 mr-2 text-verifyvision-teal" />
          Property Details
        </CardTitle>
        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div className="aspect-video relative overflow-hidden rounded-md">
              {property.imageUrl ? (
                <img 
                  src={property.imageUrl} 
                  alt={property.name || property.address} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Home className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Name</h3>
                <p>{property.name || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Property Type</h3>
                <p>{property.propertyType.replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Address</h3>
                <p>{property.address}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Location</h3>
                <p>{property.city}, {property.state} {property.zipCode}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Bedrooms</h3>
                <p>{property.bedrooms}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Bathrooms</h3>
                <p>{property.bathrooms}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Square Feet</h3>
                <p>{property.squareFeet} sqft</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Year Built</h3>
                <p>{property.yearBuilt || 'Not specified'}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyImage">Property Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 overflow-hidden rounded-md">
                  {(imageFile && URL.createObjectURL(imageFile)) || property.imageUrl ? (
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : property.imageUrl}
                      alt="Property" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <Label className="cursor-pointer flex items-center gap-1.5 bg-white border rounded-md px-3 py-1.5 text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  Upload
                  <Input
                    id="propertyImage"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="Property Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Street Address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleInputChange}
                  placeholder="Zip Code"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input
                  id="squareFeet"
                  name="squareFeet"
                  type="number"
                  min="0"
                  value={formData.squareFeet || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  name="yearBuilt"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt || ''}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <Button type="submit" className="bg-verifyvision-teal hover:bg-verifyvision-teal/90">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyInfoCard;
