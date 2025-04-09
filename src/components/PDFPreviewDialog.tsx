
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

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
  // Create a proper data URL for the PDF preview
  const embedUrl = pdfUrl ? `data:application/pdf;base64,${pdfUrl}` : null;

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
            <object 
              data={embedUrl}
              type="application/pdf"
              className="w-full h-full"
              aria-label="PDF Preview"
            >
              <p>Your browser does not support PDFs. <a href={embedUrl} download={`${reportTitle.replace(/\s+/g, '_')}.pdf`}>Download the PDF</a> instead.</p>
            </object>
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
                link.href = `data:application/pdf;base64,${downloadUrl}`;
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
