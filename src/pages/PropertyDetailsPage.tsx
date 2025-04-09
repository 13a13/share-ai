
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Building2, 
  Edit, 
  Save, 
  Plus, 
  Home,
  Upload,
  FileText
} from "lucide-react";
import { Property, Report } from "@/types";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import ReportCard from "@/components/ReportCard";

const PropertyDetailsPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId) return;
      
      try {
        setIsLoading(true);
        const propertyData = await PropertiesAPI.getById(propertyId);
        const reportsData = await ReportsAPI.getByPropertyId(propertyId);
        
        if (propertyData) {
          setProperty(propertyData);
          setFormData({
            name: propertyData.name || '',
            address: propertyData.address,
            city: propertyData.city,
            state: propertyData.state,
            zipCode: propertyData.zipCode,
            propertyType: propertyData.propertyType,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            squareFeet: propertyData.squareFeet,
            yearBuilt: propertyData.yearBuilt
          });
        }
        
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
    if (!propertyId || !property) return;
    
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
      
      const updatedProperty = await PropertiesAPI.update(propertyId, {
        ...formData,
        imageUrl
      });
      
      if (updatedProperty) {
        setProperty(updatedProperty);
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
  
  if (isLoading) {
    return (
      <div className="shareai-container flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-shareai-teal"></div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="shareai-container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-gray-500 mb-4">The property you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/properties")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="shareai-container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/properties")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-shareai-blue">
          {property.name || property.address}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center text-xl">
                <Building2 className="h-5 w-5 mr-2 text-shareai-teal" />
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
                  
                  <Button type="submit" className="bg-shareai-teal hover:bg-shareai-teal/90">
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-5 w-5 mr-2 text-shareai-teal" />
                Property Reports
              </CardTitle>
              <Button
                onClick={() => navigate(`/reports/new/${propertyId}`)}
                className="bg-shareai-teal hover:bg-shareai-teal/90"
              >
                <Plus className="h-4 w-4 mr-2" /> New Report
              </Button>
            </CardHeader>
            
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="font-medium mb-2">No Reports Yet</h3>
                  <p className="text-gray-500 mb-4">Create a new report to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report}
                      propertyAddress={property.address}
                      onDelete={async (reportId) => {
                        await ReportsAPI.delete(reportId);
                        setReports(reports.filter(r => r.id !== reportId));
                        toast({
                          title: "Report deleted",
                          description: "The report has been deleted successfully.",
                        });
                      }}
                      onDuplicate={async (reportId) => {
                        const duplicatedReport = await ReportsAPI.duplicate(reportId);
                        if (duplicatedReport) {
                          setReports([...reports, duplicatedReport]);
                          toast({
                            title: "Report duplicated",
                            description: "The report has been duplicated successfully.",
                          });
                        }
                      }}
                      onArchive={async (reportId) => {
                        const archivedReport = await ReportsAPI.update(reportId, { status: 'archived' });
                        if (archivedReport) {
                          setReports(reports.map(r => r.id === reportId ? archivedReport : r));
                          toast({
                            title: "Report archived",
                            description: "The report has been archived successfully.",
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-shareai-teal hover:bg-shareai-teal/90"
                onClick={() => navigate(`/reports/new/${propertyId}`)}
              >
                <Plus className="h-4 w-4 mr-2" /> Create New Report
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" /> {isEditing ? "Cancel Editing" : "Edit Property"}
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/properties")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Properties
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
