
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePDFGeneration, PDFGenerationStatus } from "@/services/pdf";
import { Report, Property } from "@/types";
import { Loader2, Eye, Download, FileText, AlertCircle } from "lucide-react";
import PDFPreviewDialog from "./PDFPreviewDialog";
import { downloadPdf, isIosDevice } from "@/utils/pdfUtils";
import { useToast } from "@/components/ui/use-toast";
import { getReportFileName } from "@/services/pdf/utils/reportNaming";

interface PDFExportButtonProps {
  report: Report;
  property: Property;
  directDownload?: boolean;
}

const PDFExportButton = ({ report, property, directDownload = false }: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { generatePDF, status } = usePDFGeneration();
  const { toast } = useToast();
  
  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    
    console.log("=== PDFExportButton: Starting PDF generation ===");
    console.log("Report ID:", report.id);
    console.log("Direct download:", directDownload);
    
    setIsGenerating(true);
    setLastError(null);
    
    try {
      // Generate the PDF with real report data
      console.log("=== Calling generatePDF function ===");
      const pdfData = await generatePDF(report, property);
      
      // Ensure we have the PDF data
      if (!pdfData) {
        throw new Error("Failed to generate PDF data");
      }
      
      console.log("=== PDF generated successfully ===");
      console.log("PDF data length:", pdfData.length);
      setDownloadUrl(pdfData);
      
      // If direct download is requested, trigger the download
      if (directDownload) {
        const fileName = `${getReportFileName(property)}.pdf`;
        console.log("=== Triggering direct download ===", fileName);
        downloadPdf(pdfData, fileName);
      }
      
      return pdfData;
    } catch (error) {
      console.error("=== PDFExportButton: Error generating PDF ===", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setLastError(errorMessage);
      
      // Show user-friendly error message
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please check the console for details and try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePreviewPDF = async () => {
    console.log("=== PDFExportButton: Preview PDF button clicked ===");
    
    // Generate PDF if not already generated
    const pdfData = downloadUrl || await handleGeneratePDF();
    
    // Open the preview dialog after generating
    if (pdfData) {
      console.log("=== Opening PDF preview dialog ===");
      setPreviewOpen(true);
    } else {
      console.error("=== Failed to generate PDF for preview ===");
    }
  };
  
  const isProcessing = isGenerating || status === "generating";
  
  return (
    <>
      <Button
        id="pdf-download-button"
        onClick={directDownload ? handleGeneratePDF : handlePreviewPDF}
        disabled={isProcessing}
        className="bg-shareai-teal hover:bg-shareai-teal/90 text-white transition-all px-6 shadow-md hover:shadow-lg"
        size="default"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {directDownload ? "Generating PDF..." : "Generating Preview..."}
          </>
        ) : lastError ? (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            {directDownload ? "Retry PDF" : "Retry Preview"}
          </>
        ) : (
          <>
            {directDownload ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                {isIosDevice() ? "Generate PDF" : "Download PDF"}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Preview PDF
              </>
            )}
          </>
        )}
      </Button>
      
      {lastError && (
        <div className="text-sm text-red-600 mt-1 max-w-xs">
          Error: {lastError}
        </div>
      )}
      
      <PDFPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={downloadUrl}
        isLoading={isProcessing}
        downloadUrl={downloadUrl}
        reportTitle={getReportFileName(property)}
        report={report}
        property={property}
      />
    </>
  );
};

export default PDFExportButton;
