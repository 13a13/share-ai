
import React from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface CameraHeaderProps {
  onClose: () => void;
  onDone: () => void;
  hasCapturedPhotos: boolean;
}

const CameraHeader: React.FC<CameraHeaderProps> = ({
  onClose,
  onDone,
  hasCapturedPhotos,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-black text-white">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-white hover:bg-gray-800"
      >
        <X className="h-6 w-6" />
      </Button>
      <h2 className="text-xl font-semibold">Camera</h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDone}
        disabled={!hasCapturedPhotos}
        className="text-white hover:bg-gray-800"
      >
        <Check className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default CameraHeader;
