
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

interface SectionTableProps {
  sections: SectionItem[];
  onEditSection: (section: SectionItem) => void;
}

const SectionTable = ({ sections, onEditSection }: SectionTableProps) => {
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
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default SectionTable;
