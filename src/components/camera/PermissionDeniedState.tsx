
import React from "react";
import { Button } from "@/components/ui/button";

interface PermissionDeniedStateProps {
  onClose: () => void;
}

const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
      <p className="mb-4">
        Camera access denied. Please enable camera permissions in your browser settings and try again.
      </p>
      <Button 
        onClick={onClose}
        className="bg-white text-black hover:bg-white/90"
      >
        Close
      </Button>
    </div>
  );
};

export default PermissionDeniedState;
