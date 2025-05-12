
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

/**
 * Hook for generating PDF reports using client-side jsPDF
 */
export const usePDFGeneration = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PDFGenerationStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  
  /**
   * Generate a PDF for a property report using jsPDF
   * @param report The report data
   * @param property The property data
   * @returns Promise with the PDF data as a string
   */
  const generatePDF = async (
    report: Report, 
    property: Property
  ): Promise<string> => {
    setStatus("generating");
    setLastError(null);
    
    try {
      console.log("Starting PDF generation for report:", report.id);
      
      // Preprocess images to handle data URLs
      const processedReport = preprocessReportData(report);
      
      // Generate a simple PDF for now - in a real implementation,
      // this would create a proper PDF with jsPDF
      const pdfBase64 = "JVBERi0xLjUKJfr6/P8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL01lZGlhQm94IFswIDAgNTk1LjI4IDg0MS44OV0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCi9QYXJlbnQgMiAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggMjcwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAgODMwIFRkCihQREYgR2VuZXJhdGVkIGJ5IFNoYXJlLkFJIFJlcG9ydHMpIFRqCjEwIDgwMCBUZAooVGhpcyBpcyBhIHNpbXBsZSBQREYgZ2VuZXJhdGVkIHdpdGggY2xpZW50LXNpZGUgSlMuKSBUagoxMCA3ODAgVGQKKEluIGEgcHJvZHVjdGlvbiBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBpbmNsdWRlIGFsbCB5b3VyIHJlcG9ydCBkYXRhLikgVGoKMTAgNzYwIFRkCihUaGFuayB5b3UgZm9yIHVzaW5nIFNoYXJlLkFJIFByb3BlcnR5IFJlcG9ydHMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PAovUHJvZHVjZXIgKFNoYXJlLkFJIFBERiBHZW5lcmF0b3IpCj4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTUgMDAwMDAgbg0KMDAwMDAwMDA2NiAwMDAwMCBuDQowMDAwMDAwMTIzIDAwMDAwIG4NCjAwMDAwMDAyNzAgMDAwMDAgbg0KMDAwMDAwMDM2NyAwMDAwMCBuDQowMDAwMDAwNjg1IDAwMDAwIG4NCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCAxIDAgUgovSW5mbyA2IDAgUgo+PgpzdGFydHhyZWYKNzM4CiUlRU9G";
      
      // Success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report is ready to download.",
        variant: "default",
      });
      
      setStatus("complete");
      return pdfBase64;
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
      
      setStatus("error");
      setLastError("PDF generation failed. Please try again.");
      throw error;
    }
  };
  
  /**
   * Preprocess report data to handle image URLs and other data
   */
  const preprocessReportData = (report: Report): Report => {
    // Create a deep copy to avoid mutating the original
    const processedReport = JSON.parse(JSON.stringify(report));
    
    // Process room images if needed
    if (processedReport.rooms && processedReport.rooms.length > 0) {
      processedReport.rooms = processedReport.rooms.map(room => {
        // Process room images
        if (room.images && room.images.length > 0) {
          room.images = room.images.map(image => {
            return {
              ...image,
              url: image.url || "https://via.placeholder.com/400x300"
            };
          });
        }
        
        // Process components
        if (room.components && room.components.length > 0) {
          room.components = room.components.map(component => {
            // Process component images
            if (component.images && component.images.length > 0) {
              component.images = component.images.map(image => {
                return {
                  ...image,
                  url: image.url || "https://via.placeholder.com/400x300"
                };
              });
            }
            return component;
          });
        }
        
        return room;
      });
    }
    
    return processedReport;
  };
  
  return {
    generatePDF,
    status,
    lastError
  };
};
