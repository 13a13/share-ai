
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
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
    
    const fileName = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
    downloadPdf(currentPdfUrl, fileName);
  };

  return (
    <div className="flex justify-end mt-4 space-x-2">
      <Button 
        variant="outline" 
        onClick={onClose}
      >
        Close
      </Button>
      
      {viewMode === "table" && (
        <Button
          onClick={onRegeneratePdf}
          disabled={regeneratingPdf}
          className="bg-verifyvision-teal hover:bg-verifyvision-teal/90 text-white"
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
          className="bg-verifyvision-gradient-end hover:bg-verifyvision-gradient-end/90 text-white"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          {isIosDevice() ? "View PDF" : "Download"}
        </Button>
      )}
    </div>
  );
};

export default PDFPreviewFooter;
