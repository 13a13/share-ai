
import { useState } from "react";
import { Report, Property } from "@/types";
import { SectionItem } from "./types";
import SectionTable from "./SectionTable";
import EditSectionDialog from "../EditSectionDialog";
import { supabase } from "@/integrations/supabase/client";
import { ComponentUpdateAPI } from "@/lib/api/reports/componentUpdateApi";
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

// Removed local persistComponentToDatabase in favor of centralized API

  // Helper function to persist room changes to database
  const persistRoomToDatabase = async (
    reportId: string,
    roomId: string,
    updates: any
  ) => {
    const { data: inspection } = await supabase
      .from('inspections')
      .select('room_id, report_info')
      .eq('id', reportId)
      .single();

    if (!inspection) return;

    const reportInfo = parseReportInfo(inspection.report_info);
    const isMainRoom = inspection.room_id === roomId;

    if (isMainRoom) {
      await supabase
        .from('inspections')
        .update({
          report_info: {
            ...reportInfo,
            ...updates
          }
        })
        .eq('id', reportId);
    } else {
      const additionalRooms = Array.isArray(reportInfo.additionalRooms) ? reportInfo.additionalRooms : [];
      const roomIndex = additionalRooms.findIndex((room: any) => room.id === roomId);
      
      if (roomIndex !== -1) {
        additionalRooms[roomIndex] = { ...additionalRooms[roomIndex], ...updates };
        
        await supabase
          .from('inspections')
          .update({
            report_info: {
              ...reportInfo,
              additionalRooms
            }
          })
          .eq('id', reportId);
      }
    }
  };

  // Helper function to parse report info
  const parseReportInfo = (reportInfo: any): any => {
    if (!reportInfo) return {};
    if (typeof reportInfo === 'string') {
      try {
        return JSON.parse(reportInfo);
      } catch {
        return {};
      }
    }
    return reportInfo;
  };
  
  const handleEdit = (section: SectionItem) => {
    setEditingSection(section);
  };
  
  const handleSave = async (updatedSection: SectionItem) => {
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
          const updatedComponent = {
            ...updatedReport.rooms[roomIndex].components![componentIndex],
            description: updatedSection.description,
            condition: updatedSection.condition as any,
            cleanliness: updatedSection.cleanliness,
          };
          
          updatedReport.rooms[roomIndex].components![componentIndex] = updatedComponent;
          
          // Persist changes to database via centralized API
          try {
            await ComponentUpdateAPI.updateComponent(
              report.id,
              updatedSection.roomId,
              updatedSection.componentId,
              {
                description: updatedSection.description,
                condition: updatedSection.condition as any,
                cleanliness: updatedSection.cleanliness,
              }
            );
          } catch (error) {
            console.error("Failed to persist component changes:", error);
          }
        }
      } else {
        // It's a room - update its general condition
        updatedReport.rooms[roomIndex].generalCondition = updatedSection.description;
        
        // Persist room changes to database
        try {
          await persistRoomToDatabase(
            report.id,
            updatedSection.roomId,
            { generalCondition: updatedSection.description }
          );
        } catch (error) {
          console.error("Failed to persist room changes:", error);
        }
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
