
import React, { useEffect, useState } from "react";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  pdfUrl: string | null;
  regeneratedPdfUrl: string | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const PDFViewer = ({ 
  pdfUrl, 
  regeneratedPdfUrl, 
  isLoading, 
  error = null, 
  onRetry 
}: PDFViewerProps) => {
  // Create proper data URL for the PDF viewer if not already in that format
  const embedUrl = React.useMemo(() => {
    if (!pdfUrl) return null;
    
    try {
      // If pdfUrl is already a complete data URL, use it as is
      if (pdfUrl.startsWith('data:application/pdf;base64,')) {
        return pdfUrl;
      }
      
      // If it starts with 'data:' but isn't proper PDF format (e.g., datauristring format)
      if (pdfUrl.startsWith('data:')) {
        return pdfUrl;
      }
      
      // Otherwise, convert it to a proper data URL
      return `data:application/pdf;base64,${pdfUrl}`;
    } catch (error) {
      console.error("Error processing PDF URL:", error);
      return null;
    }
  }, [pdfUrl]);

  // Process regenerated PDF URL similarly
  const regeneratedEmbedUrl = React.useMemo(() => {
    if (!regeneratedPdfUrl) return null;
    
    try {
      if (regeneratedPdfUrl.startsWith('data:application/pdf;base64,')) {
        return regeneratedPdfUrl;
      }
      
      if (regeneratedPdfUrl.startsWith('data:')) {
        return regeneratedPdfUrl;
      }
      
      return `data:application/pdf;base64,${regeneratedPdfUrl}`;
    } catch (error) {
      console.error("Error processing regenerated PDF URL:", error);
      return null;
    }
  }, [regeneratedPdfUrl]);

  // Set up a key to force iframe refresh when URL changes
  const [iframeKey, setIframeKey] = useState(0);
  // Check if the user is on iOS
  const [isIOS, setIsIOS] = useState(false);
  // Track PDF loading errors
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // Detect iOS devices
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIsIOS);
    
    // Reset error state when URL changes
    setHasError(false);
    setErrorMessage(null);
    
    // Use provided error if available
    if (error) {
      setHasError(true);
      setErrorMessage(error);
    }
    
    // Refresh iframe when embedUrl changes
    const currentUrl = regeneratedEmbedUrl || embedUrl;
    if (currentUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [embedUrl, regeneratedEmbedUrl, error]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal mb-4" />
        <span className="text-shareai-blue font-medium">Generating PDF preview...</span>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  if (hasError || (!embedUrl && !regeneratedEmbedUrl)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {errorMessage ? 'PDF Generation Error' : 'No Preview Available'}
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {errorMessage || "Could not generate a PDF preview. The LaTeX service may be temporarily unavailable."}
        </p>
        
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="bg-shareai-teal hover:bg-shareai-teal/90 text-white"
          >
            Try Again
          </Button>
        )}
        
        <div className="w-full max-w-md bg-gray-100 rounded-lg p-4 mt-6">
          <h4 className="font-medium mb-2">Troubleshooting tips:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Try refreshing the page and generating the PDF again</li>
            <li>Check if your internet connection is stable</li>
            <li>If you have many images, try generating a report with fewer images</li>
            <li>For best results, use the Download button which creates a simpler PDF</li>
          </ul>
        </div>
      </div>
    );
  }

  const finalUrl = regeneratedEmbedUrl || embedUrl;
  
  // For iOS devices, we display a message about download only
  if (isIOS) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileText className="h-16 w-16 text-shareai-teal mb-4" />
        <h3 className="text-xl font-semibold text-shareai-blue mb-2">PDF Ready</h3>
        <p className="text-center text-gray-600 mb-4">
          PDF preview is limited on iOS devices. Please use the download button below to view your PDF.
        </p>
        <div className="w-full max-w-md bg-gray-100 rounded-lg p-4">
          <h4 className="font-medium mb-2">Tips for iOS users:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Use the Download button to save the PDF</li>
            <li>Open the PDF in Apple's Books or Files app</li>
            <li>For best experience, view on desktop or use the Share.AI mobile app</li>
          </ul>
        </div>
      </div>
    );
  }
  
  // For non-iOS devices, show the regular iframe preview
  return (
    <div className="h-full w-full relative">
      <iframe 
        key={iframeKey}
        src={finalUrl}
        className="w-full h-full"
        title="PDF Preview"
        onError={(e) => {
          console.error("Error loading PDF in iframe:", e);
          setHasError(true);
          setErrorMessage("Failed to display PDF. You can still download it using the download button.");
        }}
      />
      {/* Add subtle loading indicator overlay that fades out */}
      <div className="absolute inset-0 bg-white/50 flex items-center justify-center transition-opacity duration-1000 opacity-0 pointer-events-none">
        <span className="text-shareai-blue">Loading PDF preview...</span>
      </div>
    </div>
  );
};

export default PDFViewer;
