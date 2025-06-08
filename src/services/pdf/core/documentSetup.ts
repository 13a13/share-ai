
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";

/**
 * Sets up PDF document with metadata
 */
export const setupPDFDocument = (report: Report, property: Property): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  // Set up document metadata with updated title using property name
  const propertyTitle = property.name || property.address; // Fallback to address if name is not available
  const reportTitle = report.type === "comparison" 
    ? `Property Comparison - ${propertyTitle}` 
    : `VerifyVision Inspection Report - ${propertyTitle}`;
  
  doc.setProperties({
    title: reportTitle,
    subject: report.type === "comparison" 
      ? `Comparison Report for ${propertyTitle}` 
      : `VerifyVision Inspection Report for ${propertyTitle}`,
    author: report.reportInfo?.clerk || "VerifyVision",
    creator: "VerifyVision AI Property Reports"
  });
  
  return doc;
};
