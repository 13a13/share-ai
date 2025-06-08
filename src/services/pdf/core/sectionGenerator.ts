
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { generateCoverPage } from "../sections/coverPage";
import { generateTableOfContents } from "../sections/tableOfContents";
import { generateDisclaimerSection } from "../sections/disclaimer";
import { generateSummaryTables } from "../sections/summaryTables";
import { generateRoomSection } from "../sections/roomSection";
import { generateComparisonSection } from "../sections/comparisonSection";

/**
 * Generates all PDF sections based on report type
 */
export const generatePDFSections = async (
  doc: jsPDF,
  report: Report,
  property: Property
): Promise<void> => {
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
