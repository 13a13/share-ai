
import React from "react";

interface ConditionIndicatorProps {
  condition: string;
  type: "condition" | "cleanliness";
}

const ConditionIndicator = ({ condition, type }: ConditionIndicatorProps) => {
  if (!condition) return <span>N/A</span>;
  
  let label = "";
  let color = "";
  
  if (type === "condition") {
    switch(condition) {
      case "excellent":
        label = "Excellent";
        color = "bg-green-500";
        break;
      case "good":
        label = "Good";
        color = "bg-blue-500";
        break;
      case "fair":
        label = "Fair";
        color = "bg-yellow-500";
        break;
      case "poor":
        label = "Poor";
        color = "bg-orange-500";
        break;
      case "needs_replacement":
        label = "Needs Replacement";
        color = "bg-red-500";
        break;
      default:
        label = condition;
        color = "bg-gray-500";
    }
  } else { // cleanliness
    switch(condition) {
      case "domestic_clean":
        label = "Domestic Clean";
        color = "bg-green-500";
        break;
      case "needs_cleaning":
        label = "Needs Cleaning";
        color = "bg-yellow-500";
        break;
      case "very_dirty":
        label = "Very Dirty";
        color = "bg-red-500";
        break;
      default:
        label = condition;
        color = "bg-gray-500";
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
  );
};

export default ConditionIndicator;
