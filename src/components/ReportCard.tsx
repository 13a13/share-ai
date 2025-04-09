
import { Report, Property } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  FileText, 
  Pencil, 
  MoreHorizontal, 
  Copy, 
  Trash2,
  Archive
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ReportsAPI } from "@/lib/api";

interface ReportCardProps {
  report: Report;
  propertyAddress?: string;
  property?: Property;
  onDelete?: (reportId: string) => void;
  onDuplicate?: (reportId: string) => void;
  onArchive?: (reportId: string) => void;
}

const ReportCard = ({ 
  report, 
  propertyAddress, 
  property,
  onDelete, 
  onDuplicate,
  onArchive 
}: ReportCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      case 'archived':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Helper function to format the report type
  const formatReportType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDuplicate = async () => {
    try {
      setIsProcessing(true);
      if (onDuplicate) {
        await onDuplicate(report.id);
      }
    } catch (error) {
      console.error("Error duplicating report:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsProcessing(true);
      if (onArchive) {
        await onArchive(report.id);
      }
    } catch (error) {
      console.error("Error archiving report:", error);
      toast({
        title: "Error",
        description: "Failed to archive report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      if (onDelete) {
        await onDelete(report.id);
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <>
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {formatReportType(report.type)} Report
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadgeClass(report.status)}>
                {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => navigate(`/reports/${report.id}/edit`)}
                    disabled={report.status === 'archived'}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isProcessing}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  
                  {report.status !== 'archived' ? (
                    <DropdownMenuItem
                      onClick={handleArchive}
                      disabled={isProcessing}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  ) : null}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-600"
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
          
          {report.status === 'archived' ? (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate(`/reports/${report.id}/pdf`)}
            >
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
          ) : report.status !== 'completed' ? (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report
              and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReportCard;
