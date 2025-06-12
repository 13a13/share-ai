
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { Property, Report } from "@/types";
import PDFExportButton from "@/components/PDFExportButton";
import CheckoutButton from "@/components/CheckoutButton";

interface ReportViewHeaderProps {
  report: Report;
  property: Property;
  canStartCheckout: boolean;
}

const ReportViewHeader = ({ report, property, canStartCheckout }: ReportViewHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-bold text-shareai-blue">
          {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
        </h1>
        <p className="text-gray-600">
          {property.address}, {property.city}, {property.state} {property.zipCode}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-gray-500">
            Status: <span className="font-medium">{report.status}</span>
          </span>
          <span className="text-sm text-gray-500">
            Type: <span className="font-medium">{report.type}</span>
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/properties/${property.id}`)}
          className="border-shareai-blue text-shareai-blue hover:bg-shareai-teal hover:text-white"
        >
          Back to Property
        </Button>
        <Button 
          onClick={() => navigate(`/reports/${report.id}/edit`)}
          className="bg-shareai-teal hover:bg-shareai-teal/90 text-white px-6"
        >
          <Eye className="h-4 w-4 mr-2" />
          Edit Report
        </Button>
        {canStartCheckout && (
          <CheckoutButton 
            report={report}
            className="border-shareai-teal text-shareai-teal hover:bg-shareai-teal hover:text-white px-6"
          />
        )}
        <PDFExportButton 
          report={report} 
          property={property} 
          directDownload={false}
        />
      </div>
    </div>
  );
};

export default ReportViewHeader;
