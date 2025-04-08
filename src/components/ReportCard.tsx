
import { Report } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ReportCardProps {
  report: Report;
  propertyAddress?: string;
}

const ReportCard = ({ report, propertyAddress }: ReportCardProps) => {
  const navigate = useNavigate();
  
  // Helper function to get badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending_review':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Helper function to format the report type
  const formatReportType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {formatReportType(report.type)} Report
          </CardTitle>
          <Badge className={getStatusBadgeClass(report.status)}>
            {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
        {propertyAddress && (
          <p className="text-sm text-gray-600 mt-1">{propertyAddress}</p>
        )}
      </CardHeader>
      
      <CardContent className="text-sm pb-2">
        <div className="flex justify-between">
          <div>
            <p>Created on: {format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
            {report.completedAt && (
              <p>Completed on: {format(new Date(report.completedAt), 'MMM d, yyyy')}</p>
            )}
          </div>
          <div className="text-right">
            <p>{report.rooms.length} Rooms</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/reports/${report.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        
        {report.status !== 'completed' ? (
          <Button 
            size="sm" 
            onClick={() => navigate(`/reports/${report.id}/edit`)}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            <Pencil className="h-4 w-4 mr-1" /> Continue
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate(`/reports/${report.id}/pdf`)}
          >
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
