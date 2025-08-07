
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { setupPDFDocument } from "./documentSetup";
import { generatePDFSections } from "./sectionOrchestrator";
import { addHeadersAndFooters } from "../utils/headerFooter";
import { preloadImages } from "../utils/imagePreloader";
import { getPropertyTitle } from "../utils/reportNaming";
import { loadFreshReportData } from "../utils/databaseLoader";

/**
 * Core PDF generation logic
 */
export const generatePDFDocument = async (
  report: Report, 
  property: Property
): Promise<string> => {
  console.log("=== PDF Generation Started ===");
  // Try to load fresh data to ensure latest edits
  let effectiveReport = report;
  try {
    const fresh = await loadFreshReportData(report.id);
    if (fresh) {
      effectiveReport = fresh;
      console.log("Using fresh report data for PDF");
    }
  } catch (e) {
    // Ignore and use provided report
  }
  console.log("Report ID:", effectiveReport.id);
  console.log("Property:", property.address);
  console.log("Room count:", effectiveReport.rooms.length);
  
  // Create and setup PDF document
  const doc = setupPDFDocument(effectiveReport, property);
  
  // Preload all images to avoid async issues
  console.log("=== Starting image preload ===");
  try {
    await preloadImages(effectiveReport);
    console.log("=== Image preload completed successfully ===");
  } catch (imageError) {
    console.warn("=== Image preload had issues, continuing anyway ===", imageError);
    // Don't fail the entire PDF generation for image issues
  }
  
  // Generate all sections
  await generatePDFSections(doc, effectiveReport, property);
  
  // Add headers and footers to all pages using centralized property title utility
  console.log("=== Adding headers and footers ===");
  const propertyTitle = getPropertyTitle(property);
  addHeadersAndFooters(doc, propertyTitle);
  
  // Convert the PDF to base64
  console.log("=== Finalizing PDF ===");
  const pdfBase64 = doc.output('datauristring');
  
  return pdfBase64;
};
