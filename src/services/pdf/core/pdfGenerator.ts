
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { setupPDFDocument } from "./documentSetup";
import { generatePDFSections } from "./sectionOrchestrator";
import { addHeadersAndFooters } from "../utils/headerFooter";
import { preloadImages } from "../utils/imagePreloader";

/**
 * Core PDF generation logic
 */
export const generatePDFDocument = async (
  report: Report, 
  property: Property
): Promise<string> => {
  console.log("=== PDF Generation Started ===");
  console.log("Report ID:", report.id);
  console.log("Property:", property.address);
  console.log("Room count:", report.rooms.length);
  
  // Create and setup PDF document
  const doc = setupPDFDocument(report, property);
  
  // Preload all images to avoid async issues
  console.log("=== Starting image preload ===");
  try {
    await preloadImages(report);
    console.log("=== Image preload completed successfully ===");
  } catch (imageError) {
    console.warn("=== Image preload had issues, continuing anyway ===", imageError);
    // Don't fail the entire PDF generation for image issues
  }
  
  // Generate all sections
  await generatePDFSections(doc, report, property);
  
  // Add headers and footers to all pages using property name instead of address
  console.log("=== Adding headers and footers ===");
  const propertyTitle = property.name || property.address; // Fallback to address if name is not available
  addHeadersAndFooters(doc, propertyTitle);
  
  // Convert the PDF to base64
  console.log("=== Finalizing PDF ===");
  const pdfBase64 = doc.output('datauristring');
  
  return pdfBase64;
};
