
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitCompare, FileUp } from "lucide-react";
import { Property, Report } from "@/types";
import { ReportsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ReportCard from "@/components/ReportCard";
import UploadReportDialog from "@/components/UploadReportDialog";
import CompareReportsDialog from "@/components/CompareReportsDialog";

interface PropertyReportsCardProps {
  property: Property;
  reports: Report[];
  onReportsUpdate: (reports: Report[]) => void;
}

const PropertyReportsCard = ({ property, reports, onReportsUpdate }: PropertyReportsCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

  const handleUploadComplete = (report: Report | null) => {
    setIsUploadDialogOpen(false);
    
    if (report) {
      onReportsUpdate([...reports, report]);
      toast({
        title: "Report Uploaded",
        description: "Your report has been uploaded successfully.",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await ReportsAPI.delete(reportId);
    onReportsUpdate(reports.filter(r => r.id !== reportId));
    toast({
      title: "Report deleted",
      description: "The report has been deleted successfully.",
    });
  };

  const handleDuplicateReport = async (reportId: string) => {
    const duplicatedReport = await ReportsAPI.duplicate(reportId);
    if (duplicatedReport) {
      onReportsUpdate([...reports, duplicatedReport]);
      toast({
        title: "Report duplicated",
        description: "The report has been duplicated successfully.",
      });
    }
  };

  const handleArchiveReport = async (reportId: string) => {
    const archivedReport = await ReportsAPI.update(reportId, { status: 'archived' });
    if (archivedReport) {
      onReportsUpdate(reports.map(r => r.id === reportId ? archivedReport : r));
      toast({
        title: "Report archived",
        description: "The report has been archived successfully.",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center text-xl">
            <Plus className="h-5 w-5 mr-2 text-verifyvision-teal" />
            Property Reports
          </CardTitle>
          
          {isMobile ? (
            <div className="flex flex-col space-y-2">
              <Button
                size="sm"
                onClick={() => setIsCompareDialogOpen(true)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90 w-full"
              >
                <GitCompare className="h-4 w-4 mr-2" /> Compare
              </Button>
              <Button
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90 w-full"
              >
                <FileUp className="h-4 w-4 mr-2" /> Upload
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/reports/new/${property.id}`)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90 w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> New
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsCompareDialogOpen(true)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
              >
                <GitCompare className="h-4 w-4 mr-2" /> AI Compare Reports
              </Button>
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
              >
                <FileUp className="h-4 w-4 mr-2" /> Upload Report
              </Button>
              <Button
                onClick={() => navigate(`/reports/new/${property.id}`)}
                className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
              >
                <Plus className="h-4 w-4 mr-2" /> New Report
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-medium mb-2">No Reports Yet</h3>
              <p className="text-gray-500 mb-4">Create a new report to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <ReportCard 
                  key={report.id} 
                  report={report}
                  propertyAddress={property.address}
                  onDelete={handleDeleteReport}
                  onDuplicate={handleDuplicateReport}
                  onArchive={handleArchiveReport}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadReportDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        properties={[property]}
        onUploadComplete={handleUploadComplete}
        preselectedPropertyId={property.id}
      />
      
      <CompareReportsDialog
        isOpen={isCompareDialogOpen}
        onClose={() => setIsCompareDialogOpen(false)}
        property={property}
        reports={reports}
      />
    </>
  );
};

export default PropertyReportsCard;
