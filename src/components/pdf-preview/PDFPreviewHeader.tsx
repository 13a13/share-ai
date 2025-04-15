
import React from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PDFPreviewHeaderProps {
  reportTitle: string;
  viewMode: "table" | "pdf";
  setViewMode: (mode: "table" | "pdf") => void;
}

const PDFPreviewHeader = ({ reportTitle, viewMode, setViewMode }: PDFPreviewHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="text-xl">Report Preview: {reportTitle}</DialogTitle>
      <DialogDescription>
        Review and edit your report before downloading
      </DialogDescription>
      <div className="flex items-center justify-end space-x-2 mt-2">
        <Button 
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
        >
          Editable View
        </Button>
        <Button 
          variant={viewMode === "pdf" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("pdf")}
        >
          PDF View
        </Button>
      </div>
    </DialogHeader>
  );
};

export default PDFPreviewHeader;
