import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertiesAPI } from "@/lib/api";
import { Property, PropertyType } from "@/types";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";

const PropertyCreationPage = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "house",
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newProperty = await PropertiesAPI.create(formData);
      toast({
        title: "Property created",
        description: "Your property has been successfully created."
      });
      navigate(`/properties`);
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        title: "Error creating property",
        description: "There was a problem creating your property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="shareai-container py-8">
      <Button variant="ghost" onClick={() => navigate("/properties")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Properties
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-shareai-blue flex items-center">
          <Building2 className="h-7 w-7 mr-2" />
          Add New Property
        </h1>
        <p className="text-gray-500 mt-2">
          Enter the details of your property to create a record in the system.
        </p>
      </div>
      
      <Card className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Property Reference</Label>
              <Input id="name" name="name" placeholder="e.g. Beach House" value={formData.name} onChange={handleInputChange} required />
            </div>
            
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={formData.propertyType} onValueChange={value => handleSelectChange(value, "propertyType")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" name="address" placeholder="123 Main St" value={formData.address} onChange={handleInputChange} required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="">City</Label>
                <Input id="city" name="city" placeholder="New York" value={formData.city} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="state">Town / Borough</Label>
                <Input id="state" name="state" placeholder="NY" value={formData.state} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="zipCode">Post Code</Label>
                <Input id="zipCode" name="zipCode" placeholder="10001" value={formData.zipCode} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" min="0" value={formData.bedrooms} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" min="0" step="0.5" value={formData.bathrooms} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input id="squareFeet" name="squareFeet" type="number" min="0" value={formData.squareFeet} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate("/properties")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-shareai-teal hover:bg-shareai-teal/90" disabled={isSubmitting}>
              {isSubmitting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </> : "Create Property"}
            </Button>
          </div>
        </form>
      </Card>
    </div>;
};

export default PropertyCreationPage;
