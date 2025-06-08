
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, Property } from "@/types";
import { generatePDFDocument } from "../core/pdfGenerator";
import { handlePDFError, handlePDFSuccess } from "../utils/errorHandling";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

/**
 * Hook for generating PDF reports in Green Kite style
 */
export const usePDFGeneration = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PDFGenerationStatus>("idle");
  
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
    setStatus("generating");
    
    try {
      const pdfBase64 = await generatePDFDocument(report, property);
      
      handlePDFSuccess(pdfBase64, report, toast);
      setStatus("complete");
      
      return pdfBase64;
    } catch (error) {
      handlePDFError(error, report, toast);
      setStatus("error");
      throw error;
    }
  };
  
  return {
    generatePDF,
    status
  };
};
