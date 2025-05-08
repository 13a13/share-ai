
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { PropertiesAPI, ReportsAPI } from "@/lib/api";
import { Property } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropertySelectionForm, { ReportFormValues } from "@/components/report/PropertySelectionForm";
import NoPropertiesState from "@/components/report/NoPropertiesState";
import ReportFormLoading from "@/components/report/ReportFormLoading";

const ReportCreationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { propertyId: preselectedPropertyId } = useParams<{ propertyId: string }>();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await PropertiesAPI.getAll();
        setProperties(data);
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
  }, [toast]);
  
  const handleFormSubmit = async (values: ReportFormValues) => {
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
  
  const handleCancel = () => navigate(-1);
  const handleAddProperty = () => navigate("/properties/new");
  
  return (
    <div className="shareai-container max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-shareai-blue mb-6">Create New Report</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ReportFormLoading />
          ) : properties.length === 0 ? (
            <NoPropertiesState onAddProperty={handleAddProperty} />
          ) : (
            <PropertySelectionForm
              properties={properties}
              preselectedPropertyId={preselectedPropertyId}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submissionError={submissionError}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCreationPage;
