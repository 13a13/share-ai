import React from "react";
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { SectionItem } from "./types";
import SectionTableRow from "./SectionTableRow";
import { useToast } from "@/components/ui/use-toast";

interface EnhancedSectionTableProps {
  sections: SectionItem[];
  onEditSection: (section: SectionItem) => void;
  onSaveSection?: (section: SectionItem) => Promise<void>;
}

/**
 * Enhanced section table with better data persistence handling
 * Ensures manual edits are properly saved to the database
 */
const EnhancedSectionTable = ({ 
  sections, 
  onEditSection, 
  onSaveSection 
}: EnhancedSectionTableProps) => {
  const { toast } = useToast();

  const handleSaveSection = async (section: SectionItem) => {
    if (onSaveSection) {
      try {
        await onSaveSection(section);
        toast({
          title: "Section Saved",
          description: "Changes have been saved successfully.",
        });
      } catch (error) {
        console.error("Failed to save section:", error);
        toast({
          title: "Save Failed",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
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
          <SectionTableRow 
            key={section.id}
            section={section}
            onEdit={onEditSection}
            onSave={handleSaveSection}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default EnhancedSectionTable;