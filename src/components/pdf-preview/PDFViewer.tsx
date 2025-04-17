
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
  }, [pdfUrl]);

  // Set up a key to force iframe refresh when URL changes
  const [iframeKey, setIframeKey] = useState(0);
  
  useEffect(() => {
    // Refresh iframe when embedUrl changes
    if (embedUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [embedUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
        <span className="ml-3 text-shareai-blue">Generating preview...</span>
      </div>
    );
  }

  if (!embedUrl && !regeneratedPdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500">No preview available</p>
      </div>
    );
  }

  const finalUrl = regeneratedPdfUrl || embedUrl;
  
  return (
    <iframe 
      key={iframeKey}
      src={finalUrl}
      className="w-full h-full"
      title="PDF Preview"
      onError={(e) => {
        console.error("Error loading PDF in iframe:", e);
      }}
    />
  );
};

export default PDFViewer;
