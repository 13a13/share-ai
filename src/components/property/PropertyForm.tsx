
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertiesAPI } from "@/lib/api";
import { Property } from "@/types";
import { Loader2 } from "lucide-react";

type PropertyFormProps = {
  onSuccess?: () => void;
};

const PropertyForm = ({ onSuccess }: PropertyFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "house",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    console.log(`Select changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: name === 'propertyType' ? value : Number(value)
    }));
  };

  const validateForm = () => {
    console.log('Validating form data:', formData);
    
    if (!formData.name?.trim()) return "Property reference is required";
    if (!formData.address?.trim()) return "Address is required";
    if (!formData.city?.trim()) return "City is required";
    if (!formData.state?.trim()) return "Town/Borough is required";
    if (!formData.zipCode?.trim()) return "Post code is required";
    if (!formData.propertyType) return "Property type is required";
    if (formData.bedrooms < 0) return "Bedrooms must be 0 or more";
    if (formData.bathrooms < 0) return "Bathrooms must be 0 or more";
    if (formData.squareFeet < 0) return "Square feet must be 0 or more";
    
    console.log('Form validation passed');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    const validationError = validateForm();
    if (validationError) {
      console.error('Form validation failed:', validationError);
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Calling PropertiesAPI.create with:', formData);
      const newProperty = await PropertiesAPI.create(formData);
      console.log('Property created successfully:', newProperty);
      
      toast({
        title: "Property created",
        description: "Your property has been successfully created."
      });
      
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      } else {
        console.log('Navigating to /properties');
        navigate("/properties");
      }
    } catch (error) {
      console.error("Detailed error creating property:", error);
      
      // Extract meaningful error message
      let errorMessage = "There was a problem creating your property. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error creating property",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="p-6 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Property Reference *</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Wills Flat" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="propertyType">Property Type *</Label>
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
            <Label htmlFor="address">Street Address *</Label>
            <Input 
              id="address" 
              name="address" 
              placeholder="123 Exhibition Road" 
              value={formData.address} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input 
                id="city" 
                name="city" 
                placeholder="London" 
                value={formData.city} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="state">Town / Borough *</Label>
              <Input 
                id="state" 
                name="state" 
                placeholder="Westminster" 
                value={formData.state} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Post Code *</Label>
              <Input 
                id="zipCode" 
                name="zipCode" 
                placeholder="SW1" 
                value={formData.zipCode} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms *</Label>
              <Select 
                value={formData.bedrooms.toString()} 
                onValueChange={value => handleSelectChange(value, "bedrooms")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(11)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms *</Label>
              <Select 
                value={formData.bathrooms.toString()} 
                onValueChange={value => handleSelectChange(value, "bathrooms")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(11)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="squareFeet">Square Feet *</Label>
              <Input 
                id="squareFeet" 
                name="squareFeet" 
                type="number" 
                min="0" 
                placeholder="200" 
                value={formData.squareFeet || ""} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => navigate("/properties")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-verifyvision-teal hover:bg-verifyvision-teal/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Property"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PropertyForm;
