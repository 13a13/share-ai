
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const reportInfoSchema = z.object({
  reportDate: z.string().min(1, "Report date is required"),
  clerk: z.string().min(1, "Clerk/agent name is required"),
  inventoryType: z.string().min(1, "Inventory type is required"),
  tenantPresent: z.boolean().optional(),
  tenantName: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type ReportInfoFormValues = z.infer<typeof reportInfoSchema>;

interface ReportInfoFormProps {
  defaultValues: ReportInfoFormValues;
  onSave: (values: ReportInfoFormValues) => Promise<void>;
  isSaving: boolean;
}

const ReportInfoForm = ({ defaultValues, onSave, isSaving }: ReportInfoFormProps) => {
  const form = useForm<ReportInfoFormValues>({
    resolver: zodResolver(reportInfoSchema),
    defaultValues,
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Report Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reportDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clerk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clerk/Agent</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter clerk/agent name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inventoryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inventory type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full Inventory">Full Inventory</SelectItem>
                        <SelectItem value="Check-In">Check-In</SelectItem>
                        <SelectItem value="Check-Out">Check-Out</SelectItem>
                        <SelectItem value="Mid-Term">Mid-Term Inspection</SelectItem>
                        <SelectItem value="Interim">Interim Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tenantPresent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-shareai-teal focus:ring-shareai-teal"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Tenant Present at Inspection
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              {form.watch("tenantPresent") && (
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tenant name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional information about this report" 
                      className="min-h-[100px]"
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
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Information"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReportInfoForm;
