
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
  
  return doc;
};
