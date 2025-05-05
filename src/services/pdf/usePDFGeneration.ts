
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { generateCoverPage } from "./sections/coverPage";
import { generateTableOfContents } from "./sections/tableOfContents";
import { generateDisclaimerSection } from "./sections/disclaimer";
import { generateSummaryTables } from "./sections/summaryTables";
import { generateRoomSection } from "./sections/roomSection";
import { generateFinalSections } from "./sections/finalSections";
import { generateComparisonSection } from "./sections/comparisonSection";
import { addHeadersAndFooters } from "./utils/headerFooter";
import { useState } from "react";

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
      console.log("Starting PDF generation for report:", report.id);
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Set up document metadata
      doc.setProperties({
        title: `Property Report - ${property.address}`,
        subject: report.type === "comparison" 
          ? `Comparison Report for ${property.address}` 
          : `Inventory and Check In Report for ${property.address}`,
        author: report.reportInfo?.clerk || "Share.AI",
        creator: "Share.AI Property Reports"
      });
      
      // Preload all images to avoid async issues
      console.log("Preloading images...");
      await preloadImages(report);
      
      // Generate sections
      console.log("Generating cover page...");
      await generateCoverPage(doc, report, property);
      doc.addPage();
      
      // Track page numbers for table of contents
      const pageMap: Record<string, number> = {};
      let currentPage = 2; // Cover is page 1

      // Special handling for comparison report
      if (report.type === "comparison" && report.reportInfo?.comparisonText) {
        // Add table of contents as page 2
        pageMap["contents"] = currentPage++;
        generateTableOfContents(doc, pageMap, null); // No rooms in ToC for comparison report
        doc.addPage();
        
        // Add disclaimer section as page 3
        pageMap["disclaimer"] = currentPage++;
        generateDisclaimerSection(doc);
        doc.addPage();
        
        // Add comparison section as page 4
        pageMap["comparison"] = currentPage++;
        generateComparisonSection(doc, report);
      } else {
        // Standard report processing
        
        // Add table of contents as page 2
        pageMap["contents"] = currentPage++;
        generateTableOfContents(doc, pageMap, report);
        doc.addPage();
        
        // Add disclaimer section as page 3
        pageMap["disclaimer"] = currentPage++;
        generateDisclaimerSection(doc);
        doc.addPage();
        
        // Add summaries as page 4
        pageMap["summary"] = currentPage++;
        generateSummaryTables(doc, report, property);
        doc.addPage();
        
        // Track start of rooms for table of contents
        console.log("Generating room sections...");
        for (let i = 0; i < report.rooms.length; i++) {
          const room = report.rooms[i];
          console.log(`Processing room ${i+1}/${report.rooms.length}: ${room.name}`);
          
          // Record page number for this room
          pageMap[room.id] = currentPage++;
          
          // Generate room section
          await generateRoomSection(doc, room, i + 1);
          
          // Add new page for next room (except for last room)
          if (i < report.rooms.length - 1) {
            doc.addPage();
          }
        }
      }
      
      // Add headers and footers to all pages
      console.log("Adding headers and footers...");
      addHeadersAndFooters(doc, property.address);
      
      // Convert the PDF to base64
      console.log("Finalizing PDF...");
      const pdfBase64 = doc.output('datauristring');
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report is ready to download.",
        variant: "default",
      });
      
      setStatus("complete");
      console.log("PDF generation complete");
      
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
