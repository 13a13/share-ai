import { useState, useEffect } from "react";
import { Property } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReportsAPI } from "@/lib/api";

interface PropertyCardProps {
  property: Property;
  onDeleteClick?: (propertyId: string) => void;
}

const PropertyCard = ({ property, onDeleteClick }: PropertyCardProps) => {
  const navigate = useNavigate();
  const [reportCount, setReportCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchReportCount = async () => {
      try {
        const reports = await ReportsAPI.getByPropertyId(property.id);
        setReportCount(reports.length);
      } catch (error) {
        console.error("Error fetching report count:", error);
      }
    };
    
    fetchReportCount();
  }, [property.id]);
  
  return (
    <Card className="overflow-hidden card-hover">
      {/* Property Image */}
      <div className="relative h-40 overflow-hidden">
        {property.imageUrl ? (
          <img 
            src={property.imageUrl} 
            alt={property.name || property.address} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-shareai-teal/20 flex items-center justify-center">
            <Home className="h-12 w-12 text-shareai-teal" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className="bg-shareai-blue text-white">
            {property.propertyType}
          </Badge>
          <Badge className="bg-shareai-teal text-white">
            {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{property.name || property.address}</CardTitle>
        <CardDescription>
          {property.city}, {property.state} {property.zipCode}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-sm pb-2">
        <div className="flex justify-between">
          <span>{property.bedrooms} Bedrooms</span>
          <span>{property.bathrooms} Bathrooms</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          View Details
        </Button>
        <div className="flex gap-2">
          {onDeleteClick && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDeleteClick(property.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => navigate(`/reports/new/${property.id}`)}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            <Plus className="h-4 w-4 mr-1" /> New Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
