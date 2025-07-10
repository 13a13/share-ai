
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
    <div className={`
      flex items-center justify-between bg-black text-white p-4
      sm:flex sm:items-center sm:justify-between sm:bg-black sm:text-white sm:p-4 sm:flex-shrink-0
      md:flex md:items-center md:justify-between md:bg-black md:text-white md:p-4 md:flex-shrink-0
      lg:flex lg:items-center lg:justify-between lg:bg-black lg:text-white lg:p-4 lg:flex-shrink-0
      xl:flex xl:items-center xl:justify-between xl:bg-black xl:text-white xl:p-4 xl:flex-shrink-0
    `}>
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
