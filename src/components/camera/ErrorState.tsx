
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  errorMessage: string;
  onClose: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, onClose }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    // Trigger a page refresh to reset camera state
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center max-w-md mx-auto">
      <div className="mb-6">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
        <p className="text-sm opacity-90 leading-relaxed">
          {errorMessage}
        </p>
      </div>
      
      <div className="space-y-3 w-full">
        <div className="text-xs opacity-75 space-y-1 bg-black/20 p-3 rounded">
          <p><strong>Troubleshooting tips:</strong></p>
          <p>• Close other apps that might be using the camera</p>
          <p>• Check that your camera is properly connected</p>
          <p>• Ensure camera permissions are enabled</p>
          <p>• Try refreshing the page</p>
        </div>
        
        <div className="flex flex-col gap-2 pt-4">
          <Button 
            onClick={handleRetry}
            className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="border-white text-white hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-white text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
