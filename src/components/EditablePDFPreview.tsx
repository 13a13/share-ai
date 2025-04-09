
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle, XCircle, Camera } from "lucide-react";
import { Room, RoomComponent, Report, Property } from "@/types";
import EditSectionDialog from "./EditSectionDialog";

interface EditablePDFPreviewProps {
  report: Report;
  property: Property;
  onUpdate: (updatedReport: Report) => void;
}

interface SectionItem {
  id: string;
  numbering: string;
  title: string;
  description: string;
  condition?: string;
  cleanliness?: string;
  imageCount: number;
  roomId: string;
  componentId?: string;
  parentTitle: string;
}

const EditablePDFPreview = ({ report, property, onUpdate }: EditablePDFPreviewProps) => {
  const [sections, setSections] = useState<SectionItem[]>(() => {
    // Transform report data into flatter structure for table display
    let sectionItems: SectionItem[] = [];
    
    // Process rooms and their components
    report.rooms.forEach((room, roomIndex) => {
      // Add room as a section header
      sectionItems.push({
        id: room.id,
        numbering: `${roomIndex + 1}`,
        title: room.name,
        description: room.generalCondition || "",
        condition: undefined,
        cleanliness: undefined,
        imageCount: room.images.length,
        roomId: room.id,
        parentTitle: "",
      });
      
      // Add room components as subsections
      if (room.components) {
        room.components.forEach((component, componentIndex) => {
          sectionItems.push({
            id: component.id,
            numbering: `${roomIndex + 1}.${componentIndex + 1}`,
            title: component.name,
            description: component.description || "",
            condition: component.condition,
            cleanliness: component.cleanliness || "domestic_clean",
            imageCount: component.images.length,
            roomId: room.id,
            componentId: component.id,
            parentTitle: room.name,
          });
        });
      }
    });
    
    return sectionItems;
  });
  
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  
  const handleEdit = (section: SectionItem) => {
    setEditingSection(section);
  };
  
  const handleSave = (updatedSection: SectionItem) => {
    // Update the local sections state
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
    
    // Update the report with new data
    const updatedReport = { ...report };
    
    // Find the corresponding room
    const roomIndex = updatedReport.rooms.findIndex(room => room.id === updatedSection.roomId);
    
    if (roomIndex !== -1) {
      if (updatedSection.componentId) {
        // It's a component - update it
        const componentIndex = updatedReport.rooms[roomIndex].components?.findIndex(
          comp => comp.id === updatedSection.componentId
        ) ?? -1;
        
        if (componentIndex !== -1 && updatedReport.rooms[roomIndex].components) {
          updatedReport.rooms[roomIndex].components![componentIndex] = {
            ...updatedReport.rooms[roomIndex].components![componentIndex],
            description: updatedSection.description,
            condition: updatedSection.condition as any,
            cleanliness: updatedSection.cleanliness,
          };
        }
      } else {
        // It's a room - update its general condition
        updatedReport.rooms[roomIndex].generalCondition = updatedSection.description;
      }
    }
    
    // Notify parent of the update
    onUpdate(updatedReport);
    
    // Close the edit dialog
    setEditingSection(null);
  };
  
  const getConditionDisplay = (condition?: string) => {
    if (!condition) return "N/A";
    
    switch(condition) {
      case "excellent":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>Excellent</span>
          </div>
        );
      case "good":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>Good</span>
          </div>
        );
      case "fair":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span>Fair</span>
          </div>
        );
      case "poor":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            <span>Poor</span>
          </div>
        );
      case "needs_replacement":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Needs Replacement</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-500"></span>
            <span>{condition}</span>
          </div>
        );
    }
  };
  
  const getCleanlinessDisplay = (cleanliness?: string) => {
    if (!cleanliness) return "N/A";
    
    switch(cleanliness) {
      case "domestic_clean":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>Domestic Clean</span>
          </div>
        );
      case "needs_cleaning":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span>Needs Cleaning</span>
          </div>
        );
      case "very_dirty":
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Very Dirty</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-500"></span>
            <span>{cleanliness}</span>
          </div>
        );
    }
  };

  return (
    <div className="overflow-auto max-h-[calc(85vh-120px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Item</TableHead>
            <TableHead className="w-[300px]">Description</TableHead>
            <TableHead className="w-[120px]">Condition</TableHead>
            <TableHead className="w-[120px]">Cleanliness</TableHead>
            <TableHead className="w-[100px]">Photos</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow 
              key={section.id}
              className={!section.componentId ? "bg-gray-50 font-medium" : ""}
            >
              <TableCell className="font-medium">
                {section.numbering} {section.title}
              </TableCell>
              <TableCell>
                {section.description || "No description"}
              </TableCell>
              <TableCell>
                {section.condition ? getConditionDisplay(section.condition) : "N/A"}
              </TableCell>
              <TableCell>
                {section.cleanliness ? getCleanlinessDisplay(section.cleanliness) : "N/A"}
              </TableCell>
              <TableCell>
                {section.imageCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    <span>{section.imageCount} {section.imageCount === 1 ? "photo" : "photos"}</span>
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(section)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {editingSection && (
        <EditSectionDialog
          section={editingSection}
          onSave={handleSave}
          onCancel={() => setEditingSection(null)}
          open={!!editingSection}
        />
      )}
    </div>
  );
};

export default EditablePDFPreview;
