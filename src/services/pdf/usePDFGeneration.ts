
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
  
  /**
   * Generate a PDF for a property report using LaTeX
   * @param report The report data
   * @param property The property data
   * @returns Promise with the PDF data as a string
   */
  const generatePDF = async (
    report: Report, 
    property: Property
  ): Promise<string> => {
    setStatus("generating");
    
    try {
      console.log("Starting LaTeX PDF generation for report:", report.id);
      
      // Preprocess images to handle data URLs
      const processedReport = preprocessReportData(report);
      
      // Call the Supabase Edge Function to generate the PDF
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
      
      if (!data || !data.success || !data.pdfData) {
        console.error("Invalid response from LaTeX PDF generation:", data);
        throw new Error("Failed to generate PDF: Invalid response from server");
      }
      
      console.log("Successfully received PDF data");
      
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
            // For demo purposes, we're just returning a placeholder URL
            // In production, this would be logic to process image URLs for LaTeX
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
    status
  };
};
