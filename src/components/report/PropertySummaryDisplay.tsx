
import { Report } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PropertySummaryDisplayProps {
  report: Report;
}

const PropertySummaryDisplay = ({ report }: PropertySummaryDisplayProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Check if the report has any summary data
  const hasSummaryData = report.overallConditionSummary || 
                          report.overallCleaningSummary || 
                          report.summaryCategoriesData;
  
  if (!hasSummaryData) {
    return null;
  }
  
  const categoryTitles: Record<string, string> = {
    walls: "Walls",
    ceilings: "Ceilings",
    floors: "Floors",
    contents: "Contents & Fixtures",
    lighting: "Lighting & Switches",
    kitchen: "Kitchen & Appliances"
  };
  
  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Property Summary</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={expanded ? "" : "max-h-48 overflow-hidden relative"}>
        {report.overallConditionSummary && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Overall Condition</h3>
            <p className="text-gray-700">{report.overallConditionSummary}</p>
          </div>
        )}
        
        {report.overallCleaningSummary && (
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-lg font-semibold mb-2">Overall Cleanliness</h3>
            <p className="text-gray-700">{report.overallCleaningSummary}</p>
          </div>
        )}
        
        {report.summaryCategoriesData && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Category Summaries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categoryTitles).map(([key, title]) => {
                const category = report.summaryCategoriesData?.[key as keyof typeof report.summaryCategoriesData];
                if (!category) return null;
                
                return (
                  <div key={key} className="space-y-2">
                    <h4 className="font-medium text-shareai-teal">{title}</h4>
                    {category.conditionSummary && (
                      <div>
                        <p className="text-xs text-gray-500">Condition:</p>
                        <p className="text-sm">{category.conditionSummary}</p>
                      </div>
                    )}
                    {category.cleanlinessSummary && (
                      <div>
                        <p className="text-xs text-gray-500">Cleanliness:</p>
                        <p className="text-sm">{category.cleanlinessSummary}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        )}
      </CardContent>
    </Card>
  );
};

export default PropertySummaryDisplay;
