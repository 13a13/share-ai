
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingSpinnerSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  className?: string;
  text?: string;
}

const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;

