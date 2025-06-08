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
import { preloadImages } from "./utils/imagePreloader";
import { useState } from "react";
import { isIosDevice } from "@/utils/pdfUtils";

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
    console.log("=== PDF Generation Started ===");
    console.log("Report ID:", report.id);
    console.log("Property:", property.address);
    console.log("Room count:", report.rooms.length);
    
    setStatus("generating");
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Set up document metadata with updated title
      const reportTitle = report.type === "comparison" 
        ? `Property Comparison - ${property.address}` 
        : `VerifyVision Inspection Report - ${property.address}`;
      
      doc.setProperties({
        title: reportTitle,
        subject: report.type === "comparison" 
          ? `Comparison Report for ${property.address}` 
          : `VerifyVision Inspection Report for ${property.address}`,
        author: report.reportInfo?.clerk || "VerifyVision",
        creator: "VerifyVision AI Property Reports"
      });
      
      // Preload all images to avoid async issues
      console.log("=== Starting image preload ===");
      try {
        await preloadImages(report);
        console.log("=== Image preload completed successfully ===");
      } catch (imageError) {
        console.warn("=== Image preload had issues, continuing anyway ===", imageError);
        // Don't fail the entire PDF generation for image issues
      }
      
      // Generate sections
      console.log("=== Generating cover page ===");
      await generateCoverPage(doc, report, property);
      doc.addPage();
      
      // Track page numbers for table of contents
      const pageMap: Record<string, number> = {};
      let currentPage = 2; // Cover is page 1
      
      // Special handling for comparison report
      if (report.type === "comparison" && report.reportInfo?.comparisonText) {
        console.log("=== Generating comparison report sections ===");
        
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
        console.log("=== Generating standard report sections ===");
        
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
        console.log("=== Generating room sections ===");
        await generateRoomSections(doc, report, pageMap, currentPage);
      }
      
      // Add headers and footers to all pages
      console.log("=== Adding headers and footers ===");
      addHeadersAndFooters(doc, property.address);
      
      // Convert the PDF to base64
      console.log("=== Finalizing PDF ===");
      const pdfBase64 = doc.output('datauristring');
      
      // Don't show success toast for comparison reports
      if (report.type !== "comparison") {
        toast({
          title: "PDF Generated Successfully",
          description: "Your report is ready to download.",
          variant: "default",
        });
      }
      
      setStatus("complete");
      console.log("=== PDF generation completed successfully ===");
      console.log("PDF size:", Math.round(pdfBase64.length / 1024), "KB");
      
      return pdfBase64;
    } catch (error) {
      console.error("=== PDF Generation Failed ===", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        reportId: report.id,
        roomCount: report.rooms.length
      });
      
      // Show error toast with more specific messaging
      let errorMessage = "There was an error generating your PDF. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('canvas') || error.message.includes('tainted')) {
          errorMessage = "Some images couldn't be processed. Try removing or replacing problematic images.";
        } else if (error.message.includes('memory') || error.message.includes('size')) {
          errorMessage = "The report is too large. Try reducing the number of images or rooms.";
        }
      }
      
      if (isIosDevice()) {
        errorMessage += " iOS has limitations with large PDFs.";
      }
      
      toast({
        title: "PDF Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setStatus("error");
      throw error;
    }
  };
  
  /**
   * Generate all room sections
   */
  const generateRoomSections = async (
    doc: jsPDF,
    report: Report,
    pageMap: Record<string, number>,
    startPage: number
  ): Promise<void> => {
    let currentPage = startPage;
    
    for (let i = 0; i < report.rooms.length; i++) {
      const room = report.rooms[i];
      console.log(`=== Processing room ${i+1}/${report.rooms.length}: ${room.name} ===`);
      
      try {
        // Record page number for this room
        pageMap[room.id] = currentPage++;
        
        // Generate room section
        await generateRoomSection(doc, room, i + 1);
        
        // Add new page for next room (except for last room)
        if (i < report.rooms.length - 1) {
          doc.addPage();
        }
        
        console.log(`=== Room ${room.name} completed successfully ===`);
      } catch (roomError) {
        console.error(`=== Error processing room ${room.name} ===`, roomError);
        // Continue with other rooms instead of failing entirely
        
        // Add a placeholder page for this room
        doc.text(`Error processing room: ${room.name}`, 20, 50);
        if (i < report.rooms.length - 1) {
          doc.addPage();
        }
      }
    }
  };
  
  return {
    generatePDF,
    status
  };
};
