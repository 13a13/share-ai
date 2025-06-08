
import { Report, Property } from "@/types";

/**
 * Utility functions for generating consistent report titles and file names
 */

/**
 * Get the display title for a property (name with fallback to address)
 */
export const getPropertyTitle = (property: Property): string => {
  return property.name || property.address;
};

/**
 * Generate the main report title for display
 */
export const getReportTitle = (report: Report, property: Property): string => {
  const propertyTitle = getPropertyTitle(property);
  return report.type === "comparison" 
    ? `Property Comparison - ${propertyTitle}` 
    : `VerifyVision Inspection Report - ${propertyTitle}`;
};

/**
 * Generate the report subject for PDF metadata
 */
export const getReportSubject = (report: Report, property: Property): string => {
  const propertyTitle = getPropertyTitle(property);
  return report.type === "comparison" 
    ? `Comparison Report for ${propertyTitle}` 
    : `VerifyVision Inspection Report for ${propertyTitle}`;
};

/**
 * Generate the display title for the cover page
 */
export const getCoverPageTitle = (report: Report): string => {
  return report.type === "comparison" ? "PROPERTY COMPARISON" : "INSPECTION REPORT";
};

/**
 * Generate the file name for PDF downloads
 */
export const getReportFileName = (property: Property): string => {
  const propertyTitle = getPropertyTitle(property);
  return `Inspection Report - ${propertyTitle.replace(/\s+/g, '_')}`;
};
