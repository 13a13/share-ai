
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { generateCoverPage } from "./pdf/coverPageGenerator";
import { generateTableOfContents } from "./pdf/tableOfContentsGenerator";
import { generateRoomSection } from "./pdf/roomSectionGenerator";
import { generateSummaryAndDisclaimers } from "./pdf/summaryGenerator";
import { PageUtils } from "./pdf/pageUtilities";

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
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Initialize page utilities
      const pageUtils = new PageUtils(doc);
      const addHeaderAndFooter = () => pageUtils.addHeaderAndFooter();
      
      // 1. COVER PAGE
      generateCoverPage(doc, report, property);
      addHeaderAndFooter();
      
      // 2. TABLE OF CONTENTS
      doc.addPage();
      addHeaderAndFooter();
      
      // Calculate room page mapping for table of contents
      const roomPageMap = pageUtils.calculateRoomPageMap(report.rooms.map(room => room.id));
      generateTableOfContents(doc, report, roomPageMap);
      
      // 3. ROOM SECTIONS
      if (report.rooms.length > 0) {
        // Process each room
        for (const room of report.rooms) {
          doc.addPage();
          addHeaderAndFooter();
          generateRoomSection(doc, room, addHeaderAndFooter);
        }
      }
      
      // 4. FINAL SUMMARY & DISCLAIMERS
      doc.addPage();
      addHeaderAndFooter();
      generateSummaryAndDisclaimers(doc, report, property);
      
      // Convert the PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report is ready to download.",
        variant: "default",
      });
      
      return pdfBase64;
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
