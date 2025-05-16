
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export interface LoadingOverlayProps {
  /**
   * Whether to show the loading overlay
   */
  isLoading: boolean;
  
  /**
   * Text to display in the loading overlay
   */
  loadingText?: string;
  
  /**
   * Type of loading indicator to display
   */
  type?: "spinner" | "progress";
  
  /**
   * Background color/opacity of the loading overlay
   */
  background?: "light" | "dark" | "transparent";
  
  /**
   * Additional CSS classes for the loading overlay
   */
  className?: string;
  
  /**
   * Children to render behind the loading overlay
   */
  children?: React.ReactNode;
}

/**
 * A reusable loading overlay component that can be used to indicate loading state
 * over any content
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  loadingText = "Loading...",
  type = "spinner",
  background = "dark",
  className,
  children
}) => {
  // Only render the loading overlay if isLoading is true
  if (!isLoading && !children) {
    return null;
  }

  // Define background styles based on the background prop
  const backgroundStyles = {
    dark: "bg-black/80",
    light: "bg-white/80",
    transparent: "bg-transparent"
  };

  // Define text color based on background
  const textColorStyles = {
    dark: "text-white",
    light: "text-gray-800",
    transparent: "text-white"
  };
  
  return (
    <div className="relative w-full h-full">
      {children}
      
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-50",
            backgroundStyles[background],
            className
          )}
        >
          {type === "spinner" ? (
            <LoadingSpinner 
              size="lg" 
              className={textColorStyles[background]}
              text={loadingText}
            />
          ) : (
            <div className="flex flex-col items-center">
              <Loader2 className={cn("h-8 w-8 animate-spin mb-2", textColorStyles[background])} />
              {loadingText && (
                <p className={cn("text-center", textColorStyles[background])}>
                  {loadingText}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
