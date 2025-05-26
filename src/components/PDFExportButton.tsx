import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePDFGeneration, PDFGenerationStatus } from "@/services/pdf";
import { Report, Property } from "@/types";
import { Loader2, Eye, Download, FileText } from "lucide-react";
import PDFPreviewDialog from "./PDFPreviewDialog";
import { downloadPdf, isIosDevice } from "@/utils/pdfUtils";

interface PDFExportButtonProps {
  report: Report;
  property: Property;
  directDownload?: boolean;
}

const PDFExportButton = ({ report, property, directDownload = false }: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { generatePDF, status } = usePDFGeneration();
  
  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      // Generate the PDF with real report data
      const pdfData = await generatePDF(report, property);
      
      // Ensure we have the PDF data
      if (!pdfData) {
        throw new Error("Failed to generate PDF data");
      }
      
      setDownloadUrl(pdfData);
      
      // If direct download is requested, trigger the download
      if (directDownload) {
        const fileName = `${getReportTitle()}.pdf`;
        downloadPdf(pdfData, fileName);
      }
      
      return pdfData;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Determine report title
  const getReportTitle = () => {
    return `Inventory & Check In - ${property.address.replace(/\s+/g, '_')}`;
  };
  
  const handlePreviewPDF = async () => {
    // Generate PDF if not already generated
    const pdfData = downloadUrl || await handleGeneratePDF();
    
    // Open the preview dialog after generating
    if (pdfData) {
      setPreviewOpen(true);
    }
  };
  
  return (
    <>
      <Button
        id="pdf-download-button"
        onClick={directDownload ? handleGeneratePDF : handlePreviewPDF}
        disabled={isGenerating || status === "generating"}
        className="bg-blue-600 hover:bg-blue-700 text-white transition-all px-6 shadow-md hover:shadow-lg"
        size="default"
      >
        {isGenerating || status === "generating" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {directDownload ? "Generating PDF..." : "Generating Preview..."}
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
      
      <PDFPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={downloadUrl}
        isLoading={isGenerating || status === "generating"}
        downloadUrl={downloadUrl}
        reportTitle={getReportTitle()}
        report={report}
        property={property}
      />
    </>
  );
};

export default PDFExportButton;
