
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Property, Report } from "@/types";
import { Loader2, GitCompare } from "lucide-react";
import PDFPreviewDialog from "./PDFPreviewDialog";
import { usePDFGeneration } from "@/services/pdf";

interface CompareReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  reports: Report[];
}

const CompareReportsDialog = ({
  isOpen,
  onClose,
  property,
  reports
}: CompareReportsDialogProps) => {
  const { toast } = useToast();
  const [firstReportId, setFirstReportId] = useState<string>("");
  const [secondReportId, setSecondReportId] = useState<string>("");
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [comparisonReport, setComparisonReport] = useState<Report | null>(null);
  const [comparisonPdfUrl, setComparisonPdfUrl] = useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // PDF generation
  const { generatePDF } = usePDFGeneration();
  
  // Filter reports to show only completed ones
  const availableReports = reports.filter(report => report.status !== "archived");
  
  // Get check-in reports
  const checkInReports = availableReports.filter(report => report.type === "check_in");
  
  // Get check-out reports
  const checkOutReports = availableReports.filter(report => report.type === "check_out");

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFirstReportId("");
      setSecondReportId("");
      setComparisonResult(null);
      setComparisonReport(null);
      setComparisonPdfUrl(null);
    }
  }, [isOpen]);
  
  const handleCompare = async () => {
    if (!firstReportId || !secondReportId) {
      toast({
        title: "Reports Required",
        description: "Please select both reports to compare.",
        variant: "destructive",
      });
      return;
    }
    
    setIsComparing(true);
    
    try {
      // Get the selected reports
      const firstReport = reports.find(r => r.id === firstReportId);
      const secondReport = reports.find(r => r.id === secondReportId);
      
      if (!firstReport || !secondReport) {
        throw new Error("One or both selected reports not found.");
      }
      
      // Simulate AI comparison (in a real implementation, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay

      // Generate comparison text and a synthetic report for PDF generation
      const comparisonText = generateDummyComparison(firstReport, secondReport);
      setComparisonResult(comparisonText);
      
      // Create a synthetic report for PDF generation
      const syntheticReport = createComparisonReport(firstReport, secondReport, comparisonText);
      setComparisonReport(syntheticReport);
      
      // Generate the PDF immediately after comparison is complete
      const pdfData = await generatePDF(syntheticReport, property);
      setComparisonPdfUrl(pdfData);
      
      toast({
        title: "Comparison Complete",
        description: "The reports have been compared successfully.",
      });
    } catch (error) {
      console.error("Error comparing reports:", error);
      toast({
        title: "Comparison Failed",
        description: "There was an error comparing the reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };
  
  // Create a synthetic report for PDF generation
  const createComparisonReport = (firstReport: Report, secondReport: Report, comparisonText: string): Report => {
    // Extract key details from both reports
    const firstReportDate = firstReport.createdAt instanceof Date
      ? firstReport.createdAt.toLocaleDateString()
      : new Date(firstReport.createdAt).toLocaleDateString();
      
    const secondReportDate = secondReport.createdAt instanceof Date
      ? secondReport.createdAt.toLocaleDateString()
      : new Date(secondReport.createdAt).toLocaleDateString();
    
    // Combine room data from both reports
    const allRooms = [...firstReport.rooms];
    
    // Add rooms from second report that don't exist in the first
    secondReport.rooms.forEach(secondRoom => {
      if (!allRooms.some(room => room.name === secondRoom.name)) {
        allRooms.push(secondRoom);
      }
    });

    const now = new Date();
    
    // Create a synthetic report with the comparison data
    return {
      id: `comparison-${firstReport.id}-${secondReport.id}`,
      propertyId: property.id,
      type: "comparison",
      status: "completed",
      name: `Comparison: ${firstReport.name || firstReport.type} vs ${secondReport.name || secondReport.type}`,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      reportInfo: {
        reportDate: now.toISOString(), // Use ISO string format for date
        clerk: "AI Comparison System",
        additionalInfo: `This is an automated comparison between "${firstReport.name || firstReport.type}" (${firstReportDate}) and "${secondReport.name || secondReport.type}" (${secondReportDate}).`,
        comparisonText: comparisonText
      },
      rooms: allRooms,
      disclaimers: [
        "This comparison report was automatically generated by the AI system.",
        "Please verify all identified differences manually before taking action.",
        "The AI system may not identify all differences between reports."
      ]
    };
  };
  
  // Generate a dummy comparison for demonstration purposes
  const generateDummyComparison = (firstReport: Report, secondReport: Report) => {
    return `
## Property Condition Comparison Report

### Summary
This report compares the "${firstReport.name || firstReport.type}" report from ${new Date(firstReport.createdAt).toLocaleDateString()} with the "${secondReport.name || secondReport.type}" report from ${new Date(secondReport.createdAt).toLocaleDateString()} for the property at ${property.address}.

### Key Differences
      
#### Living Areas
- **Living Room**: Condition changed from Good to Fair. 
- **Dining Room**: No significant changes noted.
      
#### Kitchen
- **Appliances**: Refrigerator shows new scratches on door.
- **Countertops**: New stain detected on counter near sink.
- **Cleanliness**: Reduced from "Excellent" to "Fair".
      
#### Bathrooms
- **Master Bathroom**: Sink has a new chip on the edge.
- **Guest Bathroom**: No significant changes.
      
#### Bedrooms
- **Master Bedroom**: Carpet shows new stains near the window.
- **Bedroom 2**: Wall has small holes from picture mounting.
      
### Cleanliness Assessment
Overall cleanliness has deteriorated from "Excellent" to "Fair", with particular concerns in the kitchen and master bathroom areas.
      
### Damage Assessment
Several minor damages were identified between the check-in and check-out reports, primarily in the kitchen and bedrooms. These may require attention before the next tenant.
    `;
  };
  
  // Get the title for the comparison report
  const getComparisonTitle = () => {
    if (!comparisonReport) return "Comparison Report";
    
    const firstReport = reports.find(r => r.id === firstReportId);
    const secondReport = reports.find(r => r.id === secondReportId);
    
    if (!firstReport || !secondReport) return "Comparison Report";
    
    return `${firstReport.name || firstReport.type} vs ${secondReport.name || secondReport.type}`;
  };
  
  // Handle opening PDF preview
  const handleViewPdf = () => {
    if (!comparisonReport || !comparisonPdfUrl) return;
    setShowPDFPreview(true);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="sm:max-w-4xl">
          <div className="text-xl font-semibold mb-1">Compare Reports</div>
          
          <div className="grid gap-4 py-4">
            {!comparisonResult ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right font-medium">First Report</label>
                  <Select
                    value={firstReportId}
                    onValueChange={setFirstReportId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select first report" />
                    </SelectTrigger>
                    <SelectContent>
                      {checkInReports.length > 0 ? (
                        <div className="mb-1">
                          <p className="text-xs text-gray-500 font-medium px-2 pb-1">Check-In Reports</p>
                          {checkInReports.map((report) => (
                            <SelectItem key={report.id} value={report.id}>
                              {report.name || "Check-In"} ({new Date(report.createdAt).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </div>
                      ) : null}
                      
                      {availableReports.filter(r => r.type !== "check_in" && r.type !== "check_out").map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name || "Inspection"} ({new Date(report.createdAt).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right font-medium">Second Report</label>
                  <Select
                    value={secondReportId}
                    onValueChange={setSecondReportId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select second report" />
                    </SelectTrigger>
                    <SelectContent>
                      {checkOutReports.length > 0 ? (
                        <div className="mb-1">
                          <p className="text-xs text-gray-500 font-medium px-2 pb-1">Check-Out Reports</p>
                          {checkOutReports.map((report) => (
                            <SelectItem key={report.id} value={report.id}>
                              {report.name || "Check-Out"} ({new Date(report.createdAt).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </div>
                      ) : null}
                      
                      {availableReports.filter(r => r.type !== "check_in" && r.type !== "check_out").map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name || "Inspection"} ({new Date(report.createdAt).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border overflow-auto max-h-[60vh] whitespace-pre-wrap">
                {comparisonResult}
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            {!comparisonResult ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompare} 
                  className="bg-shareai-teal hover:bg-shareai-teal/90"
                  disabled={isComparing || !firstReportId || !secondReportId}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare Reports
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setComparisonResult(null)}>
                  Back to Selection
                </Button>
                <Button 
                  onClick={handleViewPdf}
                  className="bg-shareai-teal hover:bg-shareai-teal/90"
                  disabled={!comparisonPdfUrl}
                >
                  {!comparisonPdfUrl ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>View in PDF Preview</>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      {comparisonReport && comparisonPdfUrl && (
        <PDFPreviewDialog
          open={showPDFPreview}
          onOpenChange={setShowPDFPreview}
          pdfUrl={comparisonPdfUrl}
          isLoading={false}
          downloadUrl={comparisonPdfUrl}
          reportTitle={getComparisonTitle()}
          report={comparisonReport}
          property={property}
        />
      )}
    </>
  );
};

export default CompareReportsDialog;
