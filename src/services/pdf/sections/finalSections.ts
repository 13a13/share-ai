
import { jsPDF } from "jspdf";
import { Report, Property } from "@/types";
import { pdfStyles } from "../styles";

/**
 * Generate final sections
 */
export function generateFinalSections(doc: jsPDF, report: Report, property: Property): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("FINAL NOTES & DECLARATIONS", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 100, margins + 15);
  
  let yPosition = margins + 30;
  
  // Safety devices section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Safety Devices", margins, yPosition);
  yPosition += 10;
  
  // Two-column layout for safety devices
  const leftColumnX = margins;
  const rightColumnX = pageWidth / 2 + 10;
  
  // Smoke alarms
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  doc.text("Smoke Alarms:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("Present and tested", rightColumnX, yPosition);
  yPosition += 8;
  
  // CO Detectors
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("CO Detectors:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("Present and tested", rightColumnX, yPosition);
  yPosition += 20;
  
  // Keys and security section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Keys & Security", margins, yPosition);
  yPosition += 10;
  
  // Keys table
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Front Door Keys:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("2 sets provided", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Window Keys:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("1 set provided", rightColumnX, yPosition);
  yPosition += 20;
  
  // Utility meters section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Utility Meters", margins, yPosition);
  yPosition += 10;
  
  // Meters table
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Electricity Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("12345", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Gas Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("67890", rightColumnX, yPosition);
  yPosition += 8;
  
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Water Meter Reading:", leftColumnX, yPosition);
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.text("54321", rightColumnX, yPosition);
  yPosition += 30;
  
  // Declaration section
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.subtitle);
  doc.text("Declaration", margins, yPosition);
  yPosition += 10;
  
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  const declarationText = "I/We have read and agree that this inventory is a fair and accurate assessment of the property and its contents at the start of the tenancy. If any discrepancies are noted, they will be reported in writing within 7 days of receiving this inventory. After this period the inventory will be deemed to be correct and will form the basis of the check-out report at the end of the tenancy.";
  
  const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - (margins * 2));
  doc.text(splitDeclaration, margins, yPosition);
  yPosition += splitDeclaration.length * 6 + 20;
  
  // Signature fields
  doc.setFont(pdfStyles.fonts.body, "bold");
  doc.text("Landlord/Agent Signature:", leftColumnX, yPosition);
  
  // Signature line
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(leftColumnX, yPosition + 10, leftColumnX + 80, yPosition + 10);
  
  doc.text("Date:", leftColumnX, yPosition + 20);
  doc.line(leftColumnX + 20, yPosition + 20, leftColumnX + 80, yPosition + 20);
  
  // Tenant signature field (on right side)
  doc.text("Tenant Signature:", rightColumnX, yPosition);
  
  // Signature line
  doc.line(rightColumnX, yPosition + 10, rightColumnX + 80, yPosition + 10);
  
  doc.text("Date:", rightColumnX, yPosition + 20);
  doc.line(rightColumnX + 20, yPosition + 20, rightColumnX + 80, yPosition + 20);
}
