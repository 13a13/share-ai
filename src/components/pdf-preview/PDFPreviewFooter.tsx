
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  const currentPdfUrl = regeneratedPdfUrl || downloadUrl;
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Detect iOS devices
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIsIOS);
  }, []);

  const handleDownload = () => {
    if (!currentPdfUrl) {
      toast({
        title: "Error",
        description: "No PDF is available for download. Please try regenerating the PDF.",
        variant: "destructive",
      });
      return;
    }
    
    try {
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
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                  .header { padding: 16px; background: #f3f4f6; text-align: center; font-family: -apple-system, system-ui; }
                  .content { height: calc(100% - 56px); width: 100%; overflow: auto; }
                  iframe { border: none; width: 100%; height: 100%; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h3 style="margin:0;">Long-press on the PDF below to save</h3>
                </div>
                <div class="content">
                  <iframe src="${dataUrl}"></iframe>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
          
          toast({
            title: "PDF opened in new tab",
            description: "Long-press on the PDF to save it to your device",
            duration: 5000,
          });
        } else {
          toast({
            title: "Popup blocked",
            description: "Please allow popups to view and download the PDF",
            variant: "destructive",
          });
        }
      } else {
        // For non-iOS, use the standard download link approach
        const link = document.createElement('a');
        link.href = dataUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: `Downloading ${fileName}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the PDF. Please try again.",
        variant: "destructive",
      });
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
              Generating PDF...
            </>
          ) : (
            <>Generate PDF</>
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
