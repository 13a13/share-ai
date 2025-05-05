
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Property, Report } from "@/types";
import { ReportsAPI } from "@/lib/api";
import { Loader2, Upload } from "lucide-react";

interface UploadReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onUploadComplete: (report: Report | null) => void;
  preselectedPropertyId?: string; // New prop for preselected property
}

const UploadReportDialog = ({ 
  isOpen, 
  onClose, 
  properties, 
  onUploadComplete,
  preselectedPropertyId
}: UploadReportDialogProps) => {
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string>(preselectedPropertyId || "");
  const [reportType, setReportType] = useState<"check_in" | "check_out" | "inspection">("inspection");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const formatReportType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const handleUpload = async () => {
    if (!selectedProperty) {
      toast({
        title: "Property Required",
        description: "Please select a property for this report.",
        variant: "destructive",
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Format the report type for use as name
      const reportName = formatReportType(reportType);
      
      // Create a new report first
      const newReport = await ReportsAPI.create(selectedProperty, reportType);
      
      // Get the url for the uploaded file
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          const fileUrl = event.target.result.toString();
          
          // Update the report with the file URL and name
          const updatedReport = await ReportsAPI.update(newReport.id, {
            name: reportName, // Set name based on report type
            reportInfo: {
              ...newReport.reportInfo,
              additionalInfo: file.name,
              fileUrl: fileUrl,
            },
          });
          
          toast({
            title: "Report Uploaded",
            description: `${file.name} has been uploaded as a ${reportName} report.`,
          });
          
          onUploadComplete(updatedReport);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading report:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your report. Please try again.",
        variant: "destructive",
      });
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Report</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!preselectedPropertyId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="property" className="text-right">
                Property
              </Label>
              <Select
                value={selectedProperty}
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reportType" className="text-right">
              Report Type
            </Label>
            <Select
              value={reportType}
              onValueChange={(value: "check_in" | "check_out" | "inspection") => setReportType(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check_in">Check In</SelectItem>
                <SelectItem value="check_out">Check Out</SelectItem>
                <SelectItem value="inspection">General Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Document
            </Label>
            <Input
              id="file"
              type="file"
              className="col-span-3"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedProperty || !file}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadReportDialog;
