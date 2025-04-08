
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConditionRating, RoomSection } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface RoomSectionEditorProps {
  section: RoomSection;
  onSave: (updatedSection: RoomSection) => void;
}

const sectionTitles: Record<string, string> = {
  walls: "Walls",
  ceiling: "Ceiling",
  flooring: "Flooring",
  doors: "Doors and Frames",
  windows: "Windows and Frames",
  lighting: "Lighting and Electrical Fixtures",
  furniture: "Furniture and Built-In Storage",
  appliances: "Appliances and Utility Items",
  additional: "Additional Items",
  cleaning: "Cleaning Summary"
};

const conditionOptions: { value: ConditionRating; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "needs_replacement", label: "Needs Replacement" },
];

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  condition: z.enum(["excellent", "good", "fair", "poor", "needs_replacement"] as const),
  notes: z.string().optional(),
});

const RoomSectionEditor = ({ section, onSave }: RoomSectionEditorProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: section.description,
      condition: section.condition,
      notes: section.notes || "",
    },
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave({
      ...section,
      description: values.description,
      condition: values.condition,
      notes: values.notes,
    });
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">{section.title || sectionTitles[section.type] || section.type}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the item in detail..."
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditionOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes or observations..."
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                className="bg-shareai-teal hover:bg-shareai-teal/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Section
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RoomSectionEditor;
