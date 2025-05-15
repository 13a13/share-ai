
import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

type ProgressIndicatorVariant = "spinner" | "progress" | "inline";

interface ProgressIndicatorProps {
  /** Value between 0-100 for progress bar mode */
  value?: number;
  /** Whether the indicator is currently showing loading state */
  isLoading?: boolean;
  /** The text to show next to the loading indicator */
  text?: string;
  /** The visual style of the indicator */
  variant?: ProgressIndicatorVariant;
  /** Whether to show percentage for progress bar */
  showPercentage?: boolean;
  /** Additional classes for the container */
  className?: string;
  /** Size of the spinner (sm, md, lg) */
  size?: "sm" | "md" | "lg";
}

/**
 * Unified progress indicator component that supports multiple display variants
 */
const ProgressIndicator = ({
  value = 0,
  isLoading = true,
  text,
  variant = "progress",
  showPercentage = true,
  className,
  size = "md"
}: ProgressIndicatorProps) => {
  // Don't render if not loading and variant isn't progress (which shows empty state)
  if (!isLoading && variant !== "progress") {
    return null;
  }

  // Size classes mapping for spinner
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  // Render spinner variant
  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center", className)}>
        <Loader2 className={cn("animate-spin mr-2", sizeClasses[size])} />
        {text && <span className="text-sm">{text}</span>}
      </div>
    );
  }

  // Render inline spinner (usually within buttons)
  if (variant === "inline") {
    return (
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
    );
  }

  // Render progress bar variant
  return (
    <div className={cn("space-y-1", className)}>
      {(text || showPercentage) && (
        <div className="flex justify-between text-xs">
          {text && <span>{text}</span>}
          {showPercentage && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <Progress value={value} className="h-1" />
    </div>
  );
};

export { ProgressIndicator };
