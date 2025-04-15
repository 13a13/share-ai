
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpenText } from "lucide-react";
import { ReportSummary, CategorySummary } from "@/hooks/useReportSummary";

interface ReportSummaryEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaries: ReportSummary | null;
  isAnalyzing: boolean;
  onSummaryUpdate: (
    categoryKey: string, 
    field: "conditionSummary" | "cleanlinessSummary" | "overallCondition" | "overallCleaning", 
    value: string
  ) => void;
}

const ReportSummaryEditor = ({
  open,
  onOpenChange,
  summaries,
  isAnalyzing,
  onSummaryUpdate
}: ReportSummaryEditorProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const categoryTitles: Record<string, string> = {
    walls: "Walls",
    ceilings: "Ceilings",
    floors: "Floors",
    contents: "Contents & Fixtures",
    lighting: "Lighting & Switches",
    kitchen: "Kitchen & Appliances"
  };
  
  if (isAnalyzing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Analyzing Property</DialogTitle>
            <DialogDescription>
              Generating property summaries based on component analysis...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!summaries) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpenText className="h-5 w-5 text-shareai-teal" />
            Property Summary Analysis
          </DialogTitle>
          <DialogDescription>
            Review and edit the property summaries that will appear in the final report.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mb-4 w-full">
            <TabsTrigger value="overview">Overall Summaries</TabsTrigger>
            <TabsTrigger value="categories">Category Details</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-1 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Overall Condition Summary</Label>
                  <Textarea 
                    value={summaries.overallCondition}
                    onChange={(e) => onSummaryUpdate('overall', 'overallCondition', e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-lg font-semibold">Overall Cleaning Summary</Label>
                  <Textarea 
                    value={summaries.overallCleaning}
                    onChange={(e) => onSummaryUpdate('overall', 'overallCleaning', e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="p-1 space-y-6">
              {Object.keys(categoryTitles).map((categoryKey) => {
                const categorySummary = summaries[categoryKey as keyof ReportSummary] as CategorySummary;
                return (
                  <div key={categoryKey} className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-semibold">{categoryTitles[categoryKey]}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Condition Summary</Label>
                        <Textarea 
                          value={categorySummary?.conditionSummary || "No data available"}
                          onChange={(e) => onSummaryUpdate(categoryKey, 'conditionSummary', e.target.value)}
                          className="min-h-[80px] mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Cleanliness Summary</Label>
                        <Textarea 
                          value={categorySummary?.cleanlinessSummary || "No data available"}
                          onChange={(e) => onSummaryUpdate(categoryKey, 'cleanlinessSummary', e.target.value)}
                          className="min-h-[80px] mt-1"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Components: {categorySummary?.components?.length || 0} analyzed
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportSummaryEditor;
