
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Report, RoomComponent } from "@/types";
import { GeminiAPI } from "@/lib/api";

export interface CategorySummary {
  category: string;
  conditionSummary: string;
  cleanlinessSummary: string;
  components: RoomComponent[];
}

export interface ReportSummary {
  walls: CategorySummary;
  ceilings: CategorySummary;
  floors: CategorySummary;
  contents: CategorySummary;
  lighting: CategorySummary;
  kitchen: CategorySummary;
  overallCondition: string;
  overallCleaning: string;
}

// Map component types to their categories
const categoryMap: Record<string, string> = {
  // Walls category
  "wall": "walls",
  "walls": "walls",
  "wallpaper": "walls",
  "wall_covering": "walls",
  "wall_paint": "walls",
  "door": "walls",
  
  // Ceilings category
  "ceiling": "ceilings",
  "ceilings": "ceilings",
  "ceiling_paint": "ceilings",
  
  // Floors category
  "floor": "floors",
  "flooring": "floors",
  "carpet": "floors",
  "laminate": "floors",
  "tile": "floors",
  "hardwood": "floors",
  
  // Contents & Fixtures category
  "furniture": "contents",
  "sofa": "contents",
  "chair": "contents",
  "table": "contents",
  "desk": "contents",
  "shelf": "contents",
  "cabinet": "contents",
  "wardrobe": "contents",
  "mirror": "contents",
  "curtain": "contents",
  "blind": "contents",
  "fixture": "contents",
  "fitting": "contents",
  "storage": "contents",
  
  // Lighting & Switches category
  "light": "lighting",
  "lamp": "lighting",
  "lighting": "lighting",
  "switch": "lighting",
  "outlet": "lighting",
  "socket": "lighting",
  "electrical": "lighting",
  
  // Kitchen & Appliances category
  "kitchen": "kitchen",
  "appliance": "kitchen",
  "stove": "kitchen",
  "oven": "kitchen",
  "refrigerator": "kitchen",
  "fridge": "kitchen",
  "dishwasher": "kitchen",
  "microwave": "kitchen",
  "sink": "kitchen",
  "counter": "kitchen",
  "countertop": "kitchen",
  "cabinet_kitchen": "kitchen", // Fixed duplicate "cabinet" key
  "tap": "kitchen",
  "faucet": "kitchen"
};

// Function to determine the category of a component
const determineCategory = (component: RoomComponent): string => {
  const name = component.name.toLowerCase();
  const type = component.type.toLowerCase();
  
  // Check if the component name or type matches any category
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (name.includes(keyword) || type.includes(keyword)) {
      return category;
    }
  }
  
  // Default to contents if no match is found
  return "contents";
};

export const useReportSummary = (report: Report | null) => {
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<ReportSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Collect all components from all rooms
  const collectComponents = (): RoomComponent[] => {
    if (!report) return [];
    
    return report.rooms.flatMap(room => 
      (room.components || []).filter(component => 
        // Only include components that have been analyzed
        component.description && 
        component.condition &&
        (component.images.length > 0 || component.notes)
      )
    );
  };
  
  // Group components by category
  const groupComponentsByCategory = (components: RoomComponent[]): Record<string, RoomComponent[]> => {
    const categories: Record<string, RoomComponent[]> = {
      walls: [],
      ceilings: [],
      floors: [],
      contents: [],
      lighting: [],
      kitchen: []
    };
    
    components.forEach(component => {
      const category = determineCategory(component);
      if (categories[category]) {
        categories[category].push(component);
      } else {
        // Default to contents if category doesn't match
        categories.contents.push(component);
      }
    });
    
    return categories;
  };
  
  // Generate a summary for a specific category using Gemini
  const generateCategorySummary = async (
    category: string, 
    components: RoomComponent[]
  ): Promise<CategorySummary> => {
    try {
      // Prepare component data for Gemini
      const componentData = components.map(comp => ({
        name: comp.name,
        description: comp.description,
        condition: comp.condition,
        conditionSummary: comp.conditionSummary,
        conditionPoints: comp.conditionPoints,
        cleanliness: comp.cleanliness?.replace(/_/g, ' ')
      }));
      
      // Generate summaries using Gemini
      const prompt = `
Analyze these ${category} components and provide:
1. A 1-2 sentence summary of the overall condition
2. A 1 sentence summary of cleanliness

Components data: ${JSON.stringify(componentData, null, 2)}

Use objective, consistent language. Focus on patterns across all components.
Format response as JSON with 'conditionSummary' and 'cleanlinessSummary' fields only.
`;

      // Mock response for testing - in production this would call Gemini
      // For now, let's generate some reasonable summary text
      let mockResponse: any;
      
      // Simulate API call - in production this would use GeminiAPI
      if (components.length > 0) {
        const conditions = components.map(c => c.condition);
        const cleanlinessValues = components.map(c => c.cleanliness);
        
        // Analyze predominant condition
        const conditionCounts = conditions.reduce((acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const predominantCondition = Object.entries(conditionCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        // Analyze predominant cleanliness
        const cleanlinessCounts = cleanlinessValues.reduce((acc, curr) => {
          if (curr) {
            acc[curr] = (acc[curr] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const predominantCleanliness = Object.keys(cleanlinessCounts).length > 0 
          ? Object.entries(cleanlinessCounts).sort((a, b) => b[1] - a[1])[0][0]
          : "domestic_clean";
        
        // Generate summary text based on predominant values
        const conditionText = {
          "excellent": "in excellent condition with minimal signs of wear",
          "good": "in good condition with some minor wear consistent with age",
          "fair": "in fair condition with noticeable wear and minor damage in places",
          "poor": "in poor condition with significant wear and damage requiring attention",
          "needs_replacement": "generally in need of replacement or extensive repairs"
        }[predominantCondition] || "in acceptable condition";
        
        const cleanlinessText = {
          "professional_clean": "professionally cleaned to a high standard",
          "domestic_clean": "generally clean with some minor issues",
          "requires_cleaning": "requiring cleaning in multiple areas",
          "heavily_soiled": "heavily soiled and requiring deep cleaning"
        }[predominantCleanliness?.replace(/_/g, '_') || "domestic_clean"] || "in acceptable cleanliness";
        
        mockResponse = {
          conditionSummary: `The ${category} are ${conditionText}.`,
          cleanlinessSummary: `The ${category} are ${cleanlinessText}.`
        };
      } else {
        mockResponse = {
          conditionSummary: `No ${category} components were fully analyzed.`,
          cleanlinessSummary: `No cleanliness assessment available for ${category}.`
        };
      }

      return {
        category,
        conditionSummary: mockResponse.conditionSummary,
        cleanlinessSummary: mockResponse.cleanlinessSummary,
        components
      };
    } catch (error) {
      console.error(`Error generating summary for ${category}:`, error);
      return {
        category,
        conditionSummary: `Unable to generate condition summary for ${category}.`,
        cleanlinessSummary: `Unable to generate cleanliness summary for ${category}.`,
        components
      };
    }
  };
  
  // Generate overall summaries from category summaries
  const generateOverallSummaries = (categorySummaries: CategorySummary[]): {
    overallCondition: string;
    overallCleaning: string;
  } => {
    // Combine category summaries into overall summaries
    const conditionPoints = categorySummaries
      .filter(summary => summary.components.length > 0)
      .map(summary => summary.conditionSummary);
    
    const cleaningPoints = categorySummaries
      .filter(summary => summary.components.length > 0)
      .map(summary => summary.cleanlinessSummary);
    
    const overallCondition = conditionPoints.length > 0
      ? `Overall, the property shows ${determineOverallConditionTone(categorySummaries)}. ${conditionPoints.slice(0, 3).join(' ')}`
      : "No sufficient component data to generate an overall condition assessment.";
    
    const overallCleaning = cleaningPoints.length > 0
      ? `The property is ${determineOverallCleaningTone(categorySummaries)}. ${cleaningPoints.slice(0, 2).join(' ')}`
      : "No sufficient component data to generate an overall cleanliness assessment.";
    
    return {
      overallCondition,
      overallCleaning
    };
  };
  
  // Determine overall condition tone based on component conditions
  const determineOverallConditionTone = (categorySummaries: CategorySummary[]): string => {
    const allComponents = categorySummaries.flatMap(summary => summary.components);
    const conditions = allComponents.map(comp => comp.condition);
    
    const conditionScore = conditions.reduce((score, condition) => {
      switch (condition) {
        case "excellent": return score + 4;
        case "good": return score + 3;
        case "fair": return score + 2;
        case "poor": return score + 1;
        case "needs_replacement": return score + 0;
        default: return score + 2;
      }
    }, 0) / (conditions.length || 1);
    
    if (conditionScore >= 3.5) return "excellent condition with minimal wear";
    if (conditionScore >= 2.8) return "good condition with typical signs of use";
    if (conditionScore >= 2.0) return "fair condition with noticeable wear in several areas";
    if (conditionScore >= 1.0) return "poor condition with significant wear and damage";
    return "serious wear and damage requiring immediate attention";
  };
  
  // Determine overall cleaning tone based on component cleanliness
  const determineOverallCleaningTone = (categorySummaries: CategorySummary[]): string => {
    const allComponents = categorySummaries.flatMap(summary => summary.components);
    const cleanlinessValues = allComponents
      .map(comp => comp.cleanliness)
      .filter(Boolean) as string[];
    
    const cleanlinessScore = cleanlinessValues.reduce((score, cleanliness) => {
      switch (cleanliness) {
        case "professional_clean": return score + 4;
        case "domestic_clean": return score + 3;
        case "requires_cleaning": return score + 2;
        case "heavily_soiled": return score + 1;
        default: return score + 2.5;
      }
    }, 0) / (cleanlinessValues.length || 1);
    
    if (cleanlinessScore >= 3.5) return "professionally cleaned to a high standard";
    if (cleanlinessScore >= 2.8) return "generally clean with some minor areas requiring attention";
    if (cleanlinessScore >= 2.0) return "moderately clean but requiring additional cleaning in several areas";
    if (cleanlinessScore >= 1.0) return "requiring thorough cleaning throughout";
    return "heavily soiled and requiring professional deep cleaning";
  };
  
  // Main function to generate summaries for all categories
  const generateSummaries = async () => {
    if (!report) {
      toast({
        title: "No report available",
        description: "Cannot generate summaries without a report.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Collect and group components
      const components = collectComponents();
      const categorizedComponents = groupComponentsByCategory(components);
      
      // Generate summaries for each category
      const categorySummaries: Record<string, CategorySummary> = {};
      
      for (const [category, components] of Object.entries(categorizedComponents)) {
        categorySummaries[category] = await generateCategorySummary(category, components);
      }
      
      // Generate overall summaries
      const { overallCondition, overallCleaning } = generateOverallSummaries(
        Object.values(categorySummaries)
      );
      
      // Set the summaries state
      setSummaries({
        ...categorySummaries as any,
        overallCondition,
        overallCleaning
      });
      
      toast({
        title: "Summaries Generated",
        description: "Property summaries have been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating summaries:", error);
      toast({
        title: "Error Generating Summaries",
        description: "Failed to generate property summaries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to update a specific summary
  const updateSummary = (
    categoryKey: string, 
    field: "conditionSummary" | "cleanlinessSummary" | "overallCondition" | "overallCleaning", 
    value: string
  ) => {
    if (!summaries) return;
    
    setSummaries(prev => {
      if (!prev) return prev;
      
      if (field === "overallCondition" || field === "overallCleaning") {
        return {
          ...prev,
          [field]: value
        };
      }
      
      return {
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey as keyof typeof prev] as CategorySummary,
          [field]: value
        }
      };
    });
  };
  
  return {
    summaries,
    isAnalyzing,
    generateSummaries,
    updateSummary
  };
};
