
import { Property } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden card-hover">
      {/* Property Image */}
      <div className="relative h-40 overflow-hidden">
        {property.imageUrl ? (
          <img 
            src={property.imageUrl} 
            alt={property.address} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-shareai-teal/20 flex items-center justify-center">
            <Home className="h-12 w-12 text-shareai-teal" />
          </div>
        )}
        <Badge className="absolute top-2 right-2 bg-shareai-blue text-white">
          {property.propertyType}
        </Badge>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{property.address}</CardTitle>
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
        <Button 
          size="sm" 
          onClick={() => navigate(`/reports/new/${property.id}`)}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          <Plus className="h-4 w-4 mr-1" /> New Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
