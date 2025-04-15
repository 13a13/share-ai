
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditablePDFPreview from "./pdf-preview/EditablePDFPreview";
import { Report, Property } from "@/types";
import { usePDFGeneration } from "@/services/pdfGenerationService";
import PDFViewer from "./pdf-preview/PDFViewer";
import PDFPreviewHeader from "./pdf-preview/PDFPreviewHeader";
import PDFPreviewFooter from "./pdf-preview/PDFPreviewFooter";

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  isLoading: boolean;
  downloadUrl: string | null;
  reportTitle: string;
  report: Report;
  property: Property;
}

const PDFPreviewDialog = ({
  open,
  onOpenChange,
  pdfUrl,
  isLoading,
  downloadUrl,
  reportTitle,
  report,
  property
}: PDFPreviewDialogProps) => {
  // Manage the view mode - editable table or raw PDF
  const [viewMode, setViewMode] = useState<"table" | "pdf">("table");
  
  // State for the report data that can be edited
  const [editedReport, setEditedReport] = useState<Report>(report);
  
  // Update report state when the prop changes
  useEffect(() => {
    setEditedReport(report);
  }, [report]);

  // Regenerate PDF functionality
  const { generatePDF } = usePDFGeneration();
  const [regeneratingPdf, setRegeneratingPdf] = useState(false);
  const [regeneratedPdfUrl, setRegeneratedPdfUrl] = useState<string | null>(null);
  
  // Handle report updates from the editable preview
  const handleReportUpdate = (updatedReport: Report) => {
    setEditedReport(updatedReport);
  };
  
  // Regenerate the PDF with the updated report data
  const handleRegeneratePdf = async () => {
    setRegeneratingPdf(true);
    try {
      const newPdfData = await generatePDF(editedReport, property);
      setRegeneratedPdfUrl(newPdfData);
    } catch (error) {
      console.error("Error regenerating PDF:", error);
    } finally {
      setRegeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-11/12 h-[85vh] flex flex-col">
        <PDFPreviewHeader 
          reportTitle={reportTitle}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        
        <div className="flex-grow overflow-hidden rounded-md border border-gray-200 bg-gray-50 mt-4">
          {viewMode === "table" ? (
            <EditablePDFPreview 
              report={editedReport} 
              property={property}
              onUpdate={handleReportUpdate} 
            />
          ) : (
            <PDFViewer 
              pdfUrl={pdfUrl}
              regeneratedPdfUrl={regeneratedPdfUrl}
              isLoading={isLoading}
            />
          )}
        </div>
        
        <PDFPreviewFooter 
          onClose={() => onOpenChange(false)}
          onRegeneratePdf={handleRegeneratePdf}
          downloadUrl={downloadUrl}
          regeneratedPdfUrl={regeneratedPdfUrl}
          regeneratingPdf={regeneratingPdf}
          reportTitle={reportTitle}
          viewMode={viewMode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
