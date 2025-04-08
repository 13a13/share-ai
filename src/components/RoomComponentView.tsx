
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomComponent } from "@/types";

interface RoomComponentViewProps {
  component: RoomComponent;
}

const getConditionBadge = (condition: string) => {
  switch (condition) {
    case 'excellent':
      return <Badge className="bg-green-500">Excellent</Badge>;
    case 'good':
      return <Badge className="bg-blue-500">Good</Badge>;
    case 'fair':
      return <Badge className="bg-yellow-500">Fair</Badge>;
    case 'poor':
      return <Badge className="bg-orange-500">Poor</Badge>;
    case 'needs_replacement':
      return <Badge className="bg-red-500">Needs Replacement</Badge>;
    default:
      return <Badge>{condition}</Badge>;
  }
};

const RoomComponentView = ({ component }: RoomComponentViewProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="py-3 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">{component.name}</CardTitle>
        {getConditionBadge(component.condition)}
      </CardHeader>
      <CardContent className="py-2">
        <p className="mb-2">{component.description || "No description provided."}</p>
        {component.notes && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>Notes:</strong> {component.notes}
          </div>
        )}
        
        {component.images && component.images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {component.images.map((image) => (
              <div key={image.id} className="rounded overflow-hidden border">
                <img 
                  src={image.url} 
                  alt="Component" 
                  className="w-full h-32 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomComponentView;
