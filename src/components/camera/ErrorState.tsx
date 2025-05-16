
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ErrorStateProps {
  errorMessage: string;
  onClose: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
      <p className="mb-4">{errorMessage}</p>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-white text-black hover:bg-white/90 mb-2"
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Reload Page
      </Button>
      <Button 
        variant="outline"
        onClick={onClose}
        className="border-white text-white hover:bg-white/10"
      >
        Cancel
      </Button>
    </div>
  );
};

export default ErrorState;
