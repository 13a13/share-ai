
import { useToast } from "@/components/ui/use-toast";
import { isIosDevice } from "@/utils/pdfUtils";

/**
 * Handle PDF generation errors with user-friendly messages
 */
export const handlePDFError = (
  error: unknown,
  report: { id: string; rooms: any[]; type?: string },
  toast: ReturnType<typeof useToast>["toast"]
): void => {
  console.error("=== PDF Generation Failed ===", error);
  console.error("Error details:", {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : 'No stack trace',
    reportId: report.id,
    roomCount: report.rooms.length
  });
  
  // Show error toast with more specific messaging
  let errorMessage = "There was an error generating your PDF. Please try again.";
  
  if (error instanceof Error) {
    if (error.message.includes('canvas') || error.message.includes('tainted')) {
      errorMessage = "Some images couldn't be processed. Try removing or replacing problematic images.";
    } else if (error.message.includes('memory') || error.message.includes('size')) {
      errorMessage = "The report is too large. Try reducing the number of images or rooms.";
    }
  }
  
  if (isIosDevice()) {
    errorMessage += " iOS has limitations with large PDFs.";
  }
  
  toast({
    title: "PDF Generation Failed",
    description: errorMessage,
    variant: "destructive",
  });
};

/**
 * Handle successful PDF generation
 */
export const handlePDFSuccess = (
  pdfBase64: string,
  report: { type?: string },
  toast: ReturnType<typeof useToast>["toast"]
): void => {
  // Don't show success toast for comparison reports
  if (report.type !== "comparison") {
    toast({
      title: "PDF Generated Successfully",
      description: "Your report is ready to download.",
      variant: "default",
    });
  }
  
  console.log("=== PDF generation completed successfully ===");
  console.log("PDF size:", Math.round(pdfBase64.length / 1024), "KB");
};
