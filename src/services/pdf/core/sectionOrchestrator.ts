
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { generateCoverPage } from "../sections/coverPage";
import { generateTableOfContents } from "../sections/tableOfContents";
import { generateDisclaimerSection } from "../sections/disclaimer";
import { generateSummaryTables } from "../sections/summaryTables";
import { generateComparisonSection } from "../sections/comparisonSection";
import { generateRoomSections } from "./roomSectionGenerator";
import { PageMapper } from "./pageMapper";

/**
 * Orchestrates the generation of all PDF sections based on report type
 */
export const generatePDFSections = async (
  doc: jsPDF,
  report: Report,
  property: Property
): Promise<void> => {
  console.log("=== Generating cover page ===");
  await generateCoverPage(doc, report, property);
  doc.addPage();
  
  // Initialize page mapper starting from page 2 (cover is page 1)
  const pageMapper = new PageMapper(2);
  
  // Special handling for comparison report
  if (report.type === "comparison" && report.reportInfo?.comparisonText) {
    await generateComparisonReportSections(doc, report, pageMapper);
  } else {
    await generateStandardReportSections(doc, report, property, pageMapper);
  }
};

/**
 * Generate sections for comparison reports
 */
const generateComparisonReportSections = async (
  doc: jsPDF,
  report: Report,
  pageMapper: PageMapper
): Promise<void> => {
  console.log("=== Generating comparison report sections ===");
  
  // Add table of contents as page 2
  pageMapper.recordSection("contents");
  generateTableOfContents(doc, pageMapper.getPageMap(), null); // No rooms in ToC for comparison report
  doc.addPage();
  
  // Add disclaimer section as page 3
  pageMapper.recordSection("disclaimer");
  generateDisclaimerSection(doc);
  doc.addPage();
  
  // Add comparison section as page 4
  pageMapper.recordSection("comparison");
  generateComparisonSection(doc, report);
};

/**
 * Generate sections for standard reports
 */
const generateStandardReportSections = async (
  doc: jsPDF,
  report: Report,
  property: Property,
  pageMapper: PageMapper
): Promise<void> => {
  console.log("=== Generating standard report sections ===");
  
  // Add table of contents as page 2
  pageMapper.recordSection("contents");
  generateTableOfContents(doc, pageMapper.getPageMap(), report);
  doc.addPage();
  
  // Add disclaimer section as page 3
  pageMapper.recordSection("disclaimer");
  generateDisclaimerSection(doc);
  doc.addPage();
  
  // Add summaries as page 4
  pageMapper.recordSection("summary");
  generateSummaryTables(doc, report, property);
  doc.addPage();
  
  // Generate room sections
  await generateRoomSections(doc, report, pageMapper);
};
