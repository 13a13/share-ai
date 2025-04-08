
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePDFGeneration } from "@/services/pdfGenerationService";
import { Report, Property } from "@/types";
import { FileText, Loader2, Eye } from "lucide-react";
import PDFPreviewDialog from "./PDFPreviewDialog";

interface PDFExportButtonProps {
  report: Report;
  property: Property;
}

const PDFExportButton = ({ report, property }: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { generatePDF } = usePDFGeneration();
  
  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      // Generate the PDF with real report data
      const pdfData = await generatePDF(report, property);
      setDownloadUrl(pdfData);
      return pdfData;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportPDF = async () => {
    const pdfData = await handleGeneratePDF();
    
    if (pdfData) {
      // Trigger the download
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfData}`;
      link.setAttribute('download', `${getReportTitle()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handlePreviewPDF = async () => {
    setPreviewOpen(true);
    await handleGeneratePDF();
  };
  
  // Determine report title
  const getReportTitle = () => {
    return `${report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report - ${property.address.replace(/\s+/g, '_')}`;
  };
  
  return (
    <>
      <div className="flex space-x-2">
        <Button
          onClick={handlePreviewPDF}
          disabled={isGenerating}
          variant="outline"
          className="text-shareai-blue border-shareai-blue hover:bg-shareai-blue/10"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF
            </>
          )}
        </Button>
        
        <Button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="bg-shareai-blue hover:bg-shareai-blue/90 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Export to PDF
            </>
          )}
        </Button>
      </div>
      
      <PDFPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={downloadUrl}
        isLoading={isGenerating}
        downloadUrl={downloadUrl}
        reportTitle={getReportTitle()}
      />
    </>
  );
};

export default PDFExportButton;
