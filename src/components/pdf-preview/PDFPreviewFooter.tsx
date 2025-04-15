
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

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
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      )}
    </div>
  );
};

export default PDFPreviewFooter;
