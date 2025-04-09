import React, { useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  isLoading: boolean;
  downloadUrl: string | null;
  reportTitle: string;
}

const PDFPreviewDialog = ({
  open,
  onOpenChange,
  pdfUrl,
  isLoading,
  downloadUrl,
  reportTitle
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
  
  // Set up a key to force iframe refresh when URL changes
  const [iframeKey, setIframeKey] = React.useState(0);
  
  useEffect(() => {
    // Refresh iframe when embedUrl changes
    if (embedUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [embedUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-11/12 h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">PDF Preview: {reportTitle}</DialogTitle>
          <DialogDescription>
            Review your report before downloading
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden rounded-md border border-gray-200 bg-gray-50 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
              <span className="ml-3 text-shareai-blue">Generating PDF preview...</span>
            </div>
          ) : embedUrl ? (
            <iframe 
              key={iframeKey}
              src={embedUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
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
          {downloadUrl && (
            <Button 
              className="bg-shareai-blue hover:bg-shareai-blue/90 text-white"
              onClick={() => {
                // Create a temporary link to initiate download
                const link = document.createElement('a');
                const dataUrl = downloadUrl.startsWith('data:') 
                  ? downloadUrl
                  : `data:application/pdf;base64,${downloadUrl}`;
                
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
