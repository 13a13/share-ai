
import React from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";

interface CameraHeaderProps {
  title: string;
  onClose: () => void;
  onFlipCamera: () => void;
  isReady: boolean;
}

const CameraHeader: React.FC<CameraHeaderProps> = ({
  title,
  onClose,
  onFlipCamera,
  isReady
}) => {
  return (
    <div className="flex items-center justify-between bg-black text-white p-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onClose} 
        className="rounded-full hover:bg-white/10"
        aria-label="Close camera"
      >
        <X className="h-6 w-6" />
      </Button>

      <h2 className="text-lg font-medium">{title}</h2>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-white/10"
        onClick={onFlipCamera}
        disabled={!isReady}
        aria-label="Switch camera"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CameraHeader;
