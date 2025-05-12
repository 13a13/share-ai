import React, { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string | null;
  regeneratedPdfUrl: string | null;
  isLoading: boolean;
}

const PDFViewer = ({ pdfUrl, regeneratedPdfUrl, isLoading }: PDFViewerProps) => {
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
  
  useEffect(() => {
    // Detect iOS devices
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIsIOS);
    
    // Reset error state when URL changes
    setHasError(false);
    
    // Refresh iframe when embedUrl changes
    const currentUrl = regeneratedEmbedUrl || embedUrl;
    if (currentUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [embedUrl, regeneratedEmbedUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
        <span className="ml-3 text-shareai-blue">Generating preview...</span>
      </div>
    );
  }

  if (hasError || (!embedUrl && !regeneratedEmbedUrl)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500">
          {hasError ? "Error loading PDF preview" : "No preview available"}
        </p>
        {hasError && (
          <p className="text-sm text-gray-400 mt-2">
            Please try regenerating the PDF or downloading it directly
          </p>
        )}
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
    <iframe 
      key={iframeKey}
      src={finalUrl}
      className="w-full h-full"
      title="PDF Preview"
      onError={(e) => {
        console.error("Error loading PDF in iframe:", e);
        setHasError(true);
      }}
    />
  );
};

export default PDFViewer;
