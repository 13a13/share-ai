
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Property } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  type: z.enum(["check_in", "check_out", "inspection"]),
});

export type ReportFormValues = z.infer<typeof formSchema>;

interface PropertySelectionFormProps {
  properties: Property[];
  preselectedPropertyId?: string;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submissionError: string | null;
}

const PropertySelectionForm = ({
  properties,
  preselectedPropertyId,
  onSubmit,
  onCancel,
  isSubmitting,
  submissionError,
}: PropertySelectionFormProps) => {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: preselectedPropertyId || "",
      type: "check_in",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="check_in">Check-In Report</SelectItem>
                  <SelectItem value="check_out">Check-Out Report</SelectItem>
                  <SelectItem value="inspection">General Inspection</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {submissionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {submissionError}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Report
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PropertySelectionForm;
