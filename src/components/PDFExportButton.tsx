
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePDFGeneration } from "@/services/pdfGenerationService";
import { Report, Property } from "@/types";
import { FileText, Loader2 } from "lucide-react";

interface PDFExportButtonProps {
  report: Report;
  property: Property;
}

const PDFExportButton = ({ report, property }: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generatePDF } = usePDFGeneration();
  
  const handleExportPDF = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const downloadUrl = await generatePDF(report, property);
      
      // Open the download URL in a new tab
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
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
  );
};

export default PDFExportButton;
