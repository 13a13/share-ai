
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { getReportTitle, getReportSubject } from "../utils/reportNaming";

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
  
  // Set up document metadata using centralized naming utilities
  doc.setProperties({
    title: getReportTitle(report, property),
    subject: getReportSubject(report, property),
    author: report.reportInfo?.clerk || "VerifyVision",
    creator: "VerifyVision AI Property Reports"
  });
  
  return doc;
};
