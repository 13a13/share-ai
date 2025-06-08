
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { downloadPdf, isIosDevice } from "@/utils/pdfUtils";

interface PDFPreviewFooterProps {
  onClose: () => void;
  onRegeneratePdf: () => void;
  downloadUrl: string | null;
  regeneratedPdfUrl: string | null;
  regeneratingPdf: boolean;
  reportTitle: string;
  viewMode: "table" | "pdf";
}

const PDFPreviewFooter = ({ 
  onClose, 
  onRegeneratePdf, 
  downloadUrl, 
  regeneratedPdfUrl,
  regeneratingPdf, 
  reportTitle,
  viewMode
}: PDFPreviewFooterProps) => {
  const currentPdfUrl = regeneratedPdfUrl || downloadUrl;

  const handleDownload = () => {
    if (!currentPdfUrl) return;
    
    // The report title is already formatted correctly from the parent component
    const fileName = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
    downloadPdf(currentPdfUrl, fileName);
  };

  return (
    <div className="flex justify-end mt-4 space-x-2">
      <Button 
        variant="outline" 
        onClick={onClose}
        className="px-4"
      >
        Close
      </Button>
      
      {viewMode === "table" && (
        <Button
          onClick={onRegeneratePdf}
          disabled={regeneratingPdf}
          variant="primary"
          className="gap-2"
        >
          {regeneratingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating PDF...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Generate Updated PDF
            </>
          )}
        </Button>
      )}
      
      {currentPdfUrl && (
        <Button 
          variant="warm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isIosDevice() ? "View PDF" : "Download"}
        </Button>
      )}
    </div>
  );
};

export default PDFPreviewFooter;
