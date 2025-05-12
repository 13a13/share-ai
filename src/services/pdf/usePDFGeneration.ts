
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

/**
 * Hook for generating PDF reports using LaTeX
 */
export const usePDFGeneration = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PDFGenerationStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  /**
   * Generate a PDF for a property report using LaTeX
   * @param report The report data
   * @param property The property data
   * @param forceJsPDF Force use of client-side jsPDF instead of LaTeX
   * @returns Promise with the PDF data as a string
   */
  const generatePDF = async (
    report: Report, 
    property: Property,
    forceJsPDF: boolean = false
  ): Promise<string> => {
    setStatus("generating");
    setLastError(null);
    
    try {
      console.log("Starting LaTeX PDF generation for report:", report.id);
      
      // Preprocess images to handle data URLs
      const processedReport = preprocessReportData(report);
      
      // Try the Supabase Edge Function for LaTeX PDF generation
      if (!forceJsPDF) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
            body: { 
              report: processedReport, 
              property 
            }
          });
          
          if (error) {
            console.error("Error from LaTeX PDF generation function:", error);
            throw new Error(`LaTeX generation failed: ${error.message}`);
          }
          
          if (!data || !data.pdfData) {
            console.error("Invalid response from LaTeX PDF generation:", data);
            throw new Error("Failed to generate PDF: Invalid response from server");
          }
          
          // Check if this is a fallback PDF due to LaTeX compilation failure
          if (data.success === false && data.error) {
            console.warn("LaTeX compilation error, using fallback PDF:", data.error);
            setLastError(data.error);
          } else {
            console.log("Successfully received PDF data");
            setRetryCount(0); // Reset retry count on success
          }
          
          // Don't show success toast for comparison reports
          if (report.type !== "comparison") {
            toast({
              title: "PDF Generated Successfully",
              description: "Your report is ready to download.",
              variant: "default",
            });
          }
          
          setStatus("complete");
          return data.pdfData;
        } catch (latexError) {
          console.error("Error in LaTeX PDF generation:", latexError);
          setLastError(latexError.message);
          
          if (retryCount < 1) {
            // Increment retry count and try jsPDF as fallback
            setRetryCount(prev => prev + 1);
            console.log("Falling back to client-side PDF generation...");
            return generatePDF(report, property, true);
          }
          
          throw latexError;
        }
      }
      
      // If LaTeX failed or forceJsPDF is true, use client-side jsPDF fallback
      console.log("Using client-side PDF generation fallback");
      
      // In a real implementation, you would generate a PDF using jsPDF here
      // For now, we'll just return a placeholder
      const fallbackPdfBase64 = "JVBERi0xLjUKJfr6/P8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL01lZGlhQm94IFswIDAgNTk1LjI4IDg0MS44OV0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCi9QYXJlbnQgMiAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggMjcwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAgODMwIFRkCihGYWxsYmFjayBQREYgR2VuZXJhdGVkIGJ5IFNoYXJlLkFJIFJlcG9ydHMpIFRqCjEwIDgwMCBUZAooTGFUZVggUERGIGdlbmVyYXRpb24gZmFpbGVkLCBzbyB3ZSd2ZSBjcmVhdGVkIGEgYmFzaWMgZmFsbGJhY2sgUERGIGZvciB5b3UuKSBUagoxMCA3ODAgVGQKKFBsZWFzZSB0cnkgYWdhaW4gb3IgY29udGFjdCBzdXBwb3J0IGlmIHRoZSBwcm9ibGVtIHBlcnNpc3RzLikgVGoKMTAgNzYwIFRkCihFcnJvcjogRmFsbGJhY2sgUERGIGdlbmVyYXRlZCBkdWUgdG8gTGFUZVggZmFpbHVyZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9kdWNlciAoU2hhcmUuQUkgUERGIEdlbmVyYXRvcikKPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwMDAxNSAwMDAwMCBuDQowMDAwMDAwMDY2IDAwMDAwIG4NCjAwMDAwMDAxMjMgMDAwMDAgbg0KMDAwMDAwMDI3MCAwMDAwMCBuDQowMDAwMDAwMzY3IDAwMDAwIG4NCjAwMDAwMDA2ODUgMDAwMDAgbg0KdHJhaWxlcgo8PAovU2l6ZSA3Ci9Sb290IDEgMCBSCi9JbmZvIDYgMCBSCj4+CnN0YXJ0eHJlZgo3MzgKJSVFT0Y=";
      
      toast({
        title: "Basic PDF Generated",
        description: "We've created a simplified PDF. For best results, try again later.",
        variant: "default",
      });
      
      setStatus("complete");
      return fallbackPdfBase64;
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
      
      setStatus("error");
      throw error;
    }
  };
  
  /**
   * Preprocess report data to handle image URLs and other data
   * This helps avoid issues with LaTeX processing and ensures images are properly formatted
   */
  const preprocessReportData = (report: Report): Report => {
    // Create a deep copy to avoid mutating the original
    const processedReport = JSON.parse(JSON.stringify(report));
    
    // Process room images
    if (processedReport.rooms && processedReport.rooms.length > 0) {
      processedReport.rooms = processedReport.rooms.map(room => {
        // Process room images
        if (room.images && room.images.length > 0) {
          room.images = room.images.map(image => {
            // For LaTeX, we handle images differently - they'll use placeholder
            // images in LaTeX and the actual images will be added later
            return {
              ...image,
              url: image.url || "https://via.placeholder.com/400x300",
              placeholder: true // Mark this as a placeholder for LaTeX
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
                  url: image.url || "https://via.placeholder.com/400x300",
                  placeholder: true // Mark this as a placeholder for LaTeX
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
    lastError,
    retryCount
  };
};
