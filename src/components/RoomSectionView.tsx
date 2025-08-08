
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomSection } from "@/types";
import SignedImage from "@/components/common/SignedImage";
interface RoomSectionViewProps {
  section: RoomSection;
}

const sectionTitles: Record<string, string> = {
  walls: "Walls",
  ceiling: "Ceiling",
  flooring: "Flooring",
  doors: "Doors and Frames",
  windows: "Windows and Frames",
  lighting: "Lighting and Electrical Fixtures",
  furniture: "Furniture and Built-In Storage",
  appliances: "Appliances and Utility Items",
  cabinetry: "Cabinetry and Countertops",
  plumbing: "Plumbing Fixtures",
  additional: "Additional Items",
  cleaning: "Cleaning Summary"
};

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

const RoomSectionView = ({ section }: RoomSectionViewProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="py-3 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">{section.title || sectionTitles[section.type] || section.type}</CardTitle>
        {getConditionBadge(section.condition)}
      </CardHeader>
      <CardContent className="py-2">
        <p className="mb-2">{section.description}</p>
        {section.notes && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>Notes:</strong> {section.notes}
          </div>
        )}
        
        {section.images && section.images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {section.images.map((image) => (
              <div key={image.id} className="rounded overflow-hidden border">
                <SignedImage 
                  src={image.url} 
                  alt="Section" 
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

export default RoomSectionView;
