
import { PDFGenerationAPI } from "@/lib/api/pdfApi";
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

// PDF generation service for reports
export const usePDFGeneration = () => {
  const { toast } = useToast();
  
  /**
   * Generate a PDF for a property report
   * @param report The report data
   * @param property The property data
   * @returns Promise with the download URL
   */
  const generatePDF = async (
    report: Report, 
    property: Property
  ): Promise<string> => {
    try {
      // Call the PDF Generation API
      const pdfData = await PDFGenerationAPI.generatePDF(report.id);
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report is ready to download.",
        variant: "default",
      });
      
      return pdfData;
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  return {
    generatePDF,
  };
};
