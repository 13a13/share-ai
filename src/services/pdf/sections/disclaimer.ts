
import { jsPDF } from "jspdf";
import { pdfStyles } from "../styles";

/**
 * Generate disclaimer section
 */
export function generateDisclaimerSection(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.width;
  const margins = pdfStyles.margins.page;
  
  // Title
  doc.setFont(pdfStyles.fonts.header, "bold");
  doc.setFontSize(pdfStyles.fontSizes.title);
  doc.setTextColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.text("DISCLAIMER", margins, margins + 10);
  
  // Underline
  doc.setDrawColor(pdfStyles.colors.black[0], pdfStyles.colors.black[1], pdfStyles.colors.black[2]);
  doc.line(margins, margins + 15, margins + 60, margins + 15);
  
  const disclaimers = [
    "This inventory report provides a record of the fixtures, fittings and contents of the property, and the property's condition at the start of the tenancy.",
    "All items are assumed to be in good condition and free from damage or defects unless otherwise stated.",
    "The inventory should be carefully checked by the tenant on arrival and any discrepancies or additional damages reported within 7 days.",
    "The tenant is responsible for the return of all items listed in the same condition as at the start of tenancy, allowing for reasonable wear and tear.",
    "The inventory was conducted during daylight hours under normal lighting conditions to minimize the risk of overlooking items.",
    "Floor coverings, mattresses, and other soft furnishings have been inspected where accessible, but not moved.",
    "Items stored in lofts, cellars, locked rooms, or inaccessible locations are not included in this inventory.",
    "The inventory does not include assessments of whether appliances or heating systems are in working order.",
    "The Fire & Safety Regulations regarding furnishings, gas, electrical, and similar services are the responsibility of the instructing principal.",
    "Testing of electrical appliances or heating systems is not undertaken as part of the inventory process.",
    "It is the landlord's responsibility to ensure all safety and regulatory requirements are met.",
    "Wall surfaces have been inspected and noted from floor level. Any marks or damage at high level may not be noted.",
    "Spot-checking of bed linen and towels has been undertaken when possible.",
    "If no significant damage is detailed in this report, it is assumed items are free from defects.",
    "The accuracy of the inventory will be determined by the clerk's judgment and not limited by time restrictions.",
    "Windows may have been checked for obvious defects but not for detailed functionality.",
    "The inventory remains the property of the clerk until full payment has been received.",
    "Any discrepancies must be reported in writing within 7 days of receiving this inventory. After this period, the inventory will be deemed accepted as accurate.",
    "The tenant should note that this inventory will be used as the basis for the check-out report at the end of tenancy.",
    "This inventory has been prepared to provide a fair and accurate record of the contents and condition of the property.",
    "The landlord and tenant should carefully check this document to ensure it is an accurate representation of the property at the start of the tenancy."
  ];
  
  let yPosition = margins + 30;
  doc.setFont(pdfStyles.fonts.body, "normal");
  doc.setFontSize(pdfStyles.fontSizes.normal);
  
  // Add numbered disclaimer points with tight spacing
  disclaimers.forEach((disclaimer, index) => {
    const number = index + 1;
    const formattedText = `${number}. ${disclaimer}`;
    
    // Split text to fit the page width with justification
    const splitText = doc.splitTextToSize(formattedText, pageWidth - (margins * 2));
    
    doc.text(splitText, margins, yPosition, { align: "justify" });
    
    // Increment y position for next paragraph (with tight spacing)
    yPosition += (splitText.length * 6);
  });
}
