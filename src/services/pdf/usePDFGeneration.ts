
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
      
      // Preload all images to avoid async issues
      console.log("Preloading images...");
      await preloadImages(report);
      
      // Call the Supabase Edge Function to generate the PDF
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { report, property }
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
   * Preload all images from the report to ensure they're cached
   */
  const preloadImages = async (report: Report): Promise<void> => {
    const imagePromises: Promise<void>[] = [];
    
    // Gather all image URLs from the report
    const imageUrls: string[] = [];
    
    // Add room images
    report.rooms.forEach(room => {
      if (room.images && room.images.length > 0) {
        room.images.forEach(img => {
          if (img.url && img.url.trim() !== '') {
            imageUrls.push(img.url);
          }
        });
      }
      
      // Add component images
      if (room.components && room.components.length > 0) {
        room.components.forEach(component => {
          if (component.images && component.images.length > 0) {
            component.images.forEach(img => {
              if (img.url && img.url.trim() !== '') {
                imageUrls.push(img.url);
              }
            });
          }
        });
      }
    });
    
    // Preload each image
    imageUrls.forEach(url => {
      const promise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          resolve();
        };
        img.src = url;
      });
      
      imagePromises.push(promise);
    });
    
    // Wait for all images to preload (or fail) with a timeout
    const timeoutPromise = new Promise<void>(resolve => setTimeout(resolve, 5000));
    
    await Promise.race([
      Promise.all(imagePromises),
      timeoutPromise
    ]);
    
    console.log(`Preloaded ${imageUrls.length} images`);
  };
  
  return {
    generatePDF,
    status
  };
};
