
import React, { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import EditablePDFPreview from "./EditablePDFPreview";
import { Report, Property } from "@/types";
import { usePDFGeneration } from "@/services/pdfGenerationService";

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
  // Create proper data URL for the PDF viewer if not already in that format
  const embedUrl = React.useMemo(() => {
    if (!pdfUrl) return null;
    
    // If pdfUrl is already a complete data URL, use it as is
    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      return pdfUrl;
    }
    
    // Otherwise, convert it to a proper data URL
    return `data:application/pdf;base64,${pdfUrl}`;
  }, [pdfUrl]);

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
  
  // Set up a key to force iframe refresh when URL changes
  const [iframeKey, setIframeKey] = React.useState(0);
  
  useEffect(() => {
    // Refresh iframe when embedUrl changes
    if (embedUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [embedUrl]);
  
  // Use regenerated PDF if available, otherwise use the original
  const currentPdfUrl = regeneratedPdfUrl || downloadUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-11/12 h-[85vh] flex flex-col">
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
        
        <div className="flex-grow overflow-hidden rounded-md border border-gray-200 bg-gray-50 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
              <span className="ml-3 text-shareai-blue">Generating preview...</span>
            </div>
          ) : viewMode === "table" ? (
            <EditablePDFPreview 
              report={editedReport} 
              property={property}
              onUpdate={handleReportUpdate} 
            />
          ) : embedUrl ? (
            <iframe 
              key={iframeKey}
              src={regeneratedPdfUrl || embedUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">No preview available</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          
          {viewMode === "table" && (
            <Button
              onClick={handleRegeneratePdf}
              disabled={regeneratingPdf}
              className="bg-shareai-teal hover:bg-shareai-teal/90 text-white"
            >
              {regeneratingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating PDF...
                </>
              ) : (
                <>Generate Updated PDF</>
              )}
            </Button>
          )}
          
          {currentPdfUrl && (
            <Button 
              className="bg-shareai-blue hover:bg-shareai-blue/90 text-white"
              onClick={() => {
                // Create a temporary link to initiate download
                const link = document.createElement('a');
                const dataUrl = currentPdfUrl.startsWith('data:') 
                  ? currentPdfUrl
                  : `data:application/pdf;base64,${currentPdfUrl}`;
                
                link.href = dataUrl;
                link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.pdf`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
