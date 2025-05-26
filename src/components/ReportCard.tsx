
import { Report, Property } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Pencil, 
  MoreHorizontal, 
  Copy, 
  Trash2,
  Archive,
  FileText
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

  // Helper to check if report has uploaded document
  const hasUploadedDocument = report.reportInfo?.fileUrl !== undefined;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    navigate(`/reports/${report.id}`);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reports/${report.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reports/${report.id}/edit`);
  };
  
  return (
    <>
      <Card 
        className="card-hover cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-l-4 border-l-verifyvision-teal"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg flex items-center group">
              <span className="group-hover:text-verifyvision-teal transition-colors">
                {report.name || formatReportType(report.type)} Report
              </span>
              {hasUploadedDocument && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                  <FileText className="h-3 w-3 mr-1" />
                  Document
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadgeClass(report.status)}>
                {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/reports/${report.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/reports/${report.id}/edit`);
                    }}
                    disabled={report.status === 'archived'}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Report
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600 focus:text-red-600"
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
            <p className="text-sm text-gray-600 mt-2 font-medium">{propertyAddress}</p>
          )}
        </CardHeader>
        
        <CardContent className="text-sm pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Created</p>
              <p className="font-medium">{format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
            </div>
            {report.completedAt && (
              <div className="space-y-1">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Completed</p>
                <p className="font-medium">{format(new Date(report.completedAt), 'MMM d, yyyy')}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Rooms</p>
              <p className="font-medium">{report.rooms.length} {report.rooms.length === 1 ? 'Room' : 'Rooms'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Type</p>
              <p className="font-medium">{formatReportType(report.type)}</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4">
          <div className="w-full flex justify-center">
            {report.status === 'archived' ? (
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleViewClick}
                className="w-full max-w-xs group border-2 hover:border-verifyvision-teal hover:bg-verifyvision-teal hover:text-white transition-all duration-300"
              >
                <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" /> 
                View Report
              </Button>
            ) : report.status !== 'completed' ? (
              <Button 
                size="lg" 
                onClick={handleEditClick}
                className="w-full max-w-xs bg-gradient-to-r from-verifyvision-teal to-blue-500 hover:from-verifyvision-teal/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Pencil className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" /> 
                Continue Report
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handleViewClick}
                className="w-full max-w-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Eye className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" /> 
                View Report
              </Button>
            )}
          </div>
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
