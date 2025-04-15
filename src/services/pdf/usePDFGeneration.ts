
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { generateCoverPage } from "./sections/coverPage";
import { generateTableOfContents } from "./sections/tableOfContents";
import { generateDisclaimerSection } from "./sections/disclaimer";
import { generateSummaryTables } from "./sections/summaryTables";
import { generateRoomSection } from "./sections/roomSection";
import { generateFinalSections } from "./sections/finalSections";
import { generatePropertySummarySection } from "./sections/propertySummary";
import { addHeadersAndFooters } from "./utils/headerFooter";

export type PDFGenerationStatus = "idle" | "generating" | "complete" | "error";

/**
 * Hook for generating PDF reports in Green Kite style
 */
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
      
      // Set up document metadata
      doc.setProperties({
        title: `Inventory Report - ${property.address}`,
        subject: `Inventory and Check In Report for ${property.address}`,
        author: report.reportInfo?.clerk || "Share.AI",
        creator: "Share.AI Property Reports"
      });
      
      // Generate sections
      await generateCoverPage(doc, report, property);
      doc.addPage();
      
      // Track page numbers for table of contents
      const pageMap: Record<string, number> = {};
      let currentPage = 2; // Cover is page 1
      
      // Add table of contents (contents page) as page 2
      pageMap["contents"] = currentPage++;
      generateTableOfContents(doc, pageMap);
      doc.addPage();
      
      // Add property summary section if available
      if (report.overallConditionSummary || report.overallCleaningSummary || report.summaryCategoriesData) {
        pageMap["summary"] = currentPage++;
        generatePropertySummarySection(doc, report);
        doc.addPage();
      }
      
      // Add disclaimer section as next page
      pageMap["disclaimer"] = currentPage++;
      generateDisclaimerSection(doc);
      doc.addPage();
      
      // Add summaries as next page
      pageMap["details"] = currentPage++;
      generateSummaryTables(doc, report, property);
      doc.addPage();
      
      // Track start of rooms for table of contents
      for (let i = 0; i < report.rooms.length; i++) {
        const room = report.rooms[i];
        // Record page number for this room
        pageMap[room.id] = currentPage++;
        
        // Generate room section
        await generateRoomSection(doc, room, i + 1);
        
        // Add new page for next room (except for last room)
        if (i < report.rooms.length - 1) {
          doc.addPage();
        }
      }
      
      // Add final sections
      doc.addPage();
      pageMap["final"] = currentPage++;
      generateFinalSections(doc, report, property);
      
      // Go back and update table of contents with correct page numbers
      doc.setPage(1);
      doc.addPage();
      generateTableOfContents(doc, pageMap, report);
      
      // Add headers and footers to all pages
      addHeadersAndFooters(doc, property.address);
      
      // Convert the PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your inventory report is ready to download.",
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
