
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Camera } from "lucide-react";
import { SectionItem } from "./types";
import ConditionIndicator from "./ConditionIndicator";

interface SectionTableRowProps {
  section: SectionItem;
  onEdit: (section: SectionItem) => void;
  onSave?: (section: SectionItem) => Promise<void>;
}

const SectionTableRow = ({ section, onEdit, onSave }: SectionTableRowProps) => {
  return (
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
        {section.condition ? 
          <ConditionIndicator condition={section.condition} type="condition" /> : 
          "N/A"
        }
      </TableCell>
      <TableCell>
        {section.cleanliness ? 
          <ConditionIndicator condition={section.cleanliness} type="cleanliness" /> : 
          "N/A"
        }
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
          onClick={() => onEdit(section)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default SectionTableRow;
