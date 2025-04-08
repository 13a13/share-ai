
import React from "react";
import { Camera } from "lucide-react";
import LoadingSpinner from "./ui/LoadingSpinner";

interface ImageFileInputProps {
  id: string;
  isProcessing: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  processingLabel?: string;
}

const ImageFileInput = ({ 
  id, 
  isProcessing, 
  onChange, 
  label = "Upload Photo", 
  processingLabel = "Processing..." 
}: ImageFileInputProps) => {
  return (
    <div className="relative">
      <input
        type="file" 
        id={id} 
        accept="image/*"
        className="sr-only"
        onChange={onChange}
        disabled={isProcessing}
      />
      <label 
        htmlFor={id}
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shareai-teal hover:bg-shareai-teal/90 cursor-pointer"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" text={processingLabel} />
          </div>
        ) : (
          <div className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            {label}
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageFileInput;
