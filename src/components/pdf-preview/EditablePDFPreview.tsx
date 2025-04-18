
import { useState } from "react";
import { Report, Property } from "@/types";
import { SectionItem } from "./types";
import SectionTable from "./SectionTable";
import EditSectionDialog from "../EditSectionDialog";

interface EditablePDFPreviewProps {
  report: Report;
  property: Property;
  onUpdate: (updatedReport: Report) => void;
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

  return (
    <div className="overflow-auto max-h-[calc(85vh-120px)]">
      <SectionTable 
        sections={sections}
        onEditSection={handleEdit}
      />
      
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
