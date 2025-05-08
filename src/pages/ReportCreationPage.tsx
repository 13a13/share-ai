
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  type: z.enum(["check_in", "check_out", "inspection"]),
});

const ReportCreationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { propertyId: preselectedPropertyId } = useParams<{ propertyId: string }>();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: preselectedPropertyId || "",
      type: "check_in",
    },
  });
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await PropertiesAPI.getAll();
        setProperties(data);
        
        // If no preselected property and we have properties, select the first one
        if (!preselectedPropertyId && data.length > 0 && !form.getValues().propertyId) {
          form.setValue("propertyId", data[0].id);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load properties. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, [form, preselectedPropertyId, toast]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    console.log("Creating report with values:", values);
    
    try {
      const newReport = await ReportsAPI.create(values.propertyId, values.type);
      
      if (!newReport) {
        throw new Error("Failed to create report - no report data returned");
      }
      
      toast({
        title: "Report Created",
        description: "Your new report has been created successfully.",
      });
      
      // Navigate to the report edit page
      navigate(`/reports/${newReport.id}/edit`);
    } catch (error) {
      console.error("Error creating report:", error);
      
      // Extract a user-friendly error message
      let errorMessage = "Failed to create report. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSubmissionError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="shareai-container max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-shareai-blue mb-6">Create New Report</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-shareai-teal" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-medium mb-2">No Properties Available</h3>
              <p className="text-gray-500 mb-4">
                You need to add a property before you can create a report.
              </p>
              <Button 
                onClick={() => navigate("/properties/new")}
                className="bg-shareai-teal hover:bg-shareai-teal/90"
              >
                Add Property
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
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
                    onClick={() => navigate(-1)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCreationPage;
