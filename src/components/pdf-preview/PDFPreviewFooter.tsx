
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";

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
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Detect iOS devices
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIsIOS);
  }, []);

  const handleDownload = () => {
    if (!currentPdfUrl) return;
    
    const dataUrl = currentPdfUrl.startsWith('data:') 
      ? currentPdfUrl
      : `data:application/pdf;base64,${currentPdfUrl}`;
    
    const fileName = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
    
    // Special handling for iOS
    if (isIOS) {
      // For iOS, open in a new tab instead of downloading
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
            </head>
            <body style="margin:0;padding:0;overflow:hidden;display:flex;flex-direction:column;height:100vh;">
              <div style="padding:16px;background:#f3f4f6;text-align:center;">
                <h3 style="margin:0;font-family:sans-serif;">Long-press on the PDF below to save</h3>
              </div>
              <iframe src="${dataUrl}" style="flex-grow:1;border:none;width:100%;"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert("Please allow popups to view and download the PDF");
      }
    } else {
      // For non-iOS, use the standard download link approach
      const link = document.createElement('a');
      link.href = dataUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          {isIOS ? (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Open PDF
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default PDFPreviewFooter;
