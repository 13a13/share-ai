
import React from "react";
import { Badge } from "@/components/ui/badge";

interface ConditionIndicatorProps {
  condition: string | { summary?: string; points?: string[]; rating?: string };
  type: "condition" | "cleanliness";
}

const ConditionIndicator = ({ condition, type }: ConditionIndicatorProps) => {
  // Handle case where condition is an object instead of a string
  let displayValue: string;
  
  if (typeof condition === 'object' && condition !== null) {
    // If condition is an object, use the rating property or a default value
    displayValue = condition.rating || "Not specified";
  } else {
    // If condition is already a string, use it directly
    displayValue = condition as string;
  }
  
  const getConditionColor = (condValue: string) => {
    // Return appropriate color based on condition value
    if (type === "condition") {
      switch (condValue.toLowerCase()) {
        case "excellent":
        case "good order":
          return "bg-green-500";
        case "good":
        case "used order":
          return "bg-blue-500";
        case "fair":
        case "fair order":
          return "bg-yellow-500";
        case "poor":
        case "damaged":
          return "bg-red-500";
        default:
          return "bg-gray-400";
      }
    } else {
      // Cleanliness colors
      switch (condValue.toLowerCase()) {
        case "professional_clean":
        case "professional clean":
          return "bg-green-500";
        case "domestic_clean_high_level":
        case "domestic clean to a high level":
          return "bg-blue-500";
        case "domestic_clean":
        case "domestic clean":
          return "bg-yellow-500";
        case "not_clean":
        case "not clean":
          return "bg-red-500";
        default:
          return "bg-gray-400";
      }
    }
  };
  
  // Format display text
  const formatDisplayText = (text: string) => {
    return text
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  return (
    <Badge className={getConditionColor(displayValue)}>
      {formatDisplayText(displayValue)}
    </Badge>
  );
};

export default ConditionIndicator;
