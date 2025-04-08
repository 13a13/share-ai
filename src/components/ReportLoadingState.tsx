
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReportLoadingStateProps {
  isLoading: boolean;
  hasError: boolean;
}

const ReportLoadingState = ({ isLoading, hasError }: ReportLoadingStateProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="shareai-container flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-shareai-teal" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="shareai-container text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <p className="mb-6">The requested report could not be found or has been deleted.</p>
        <Button 
          onClick={() => navigate("/reports")}
          className="bg-shareai-teal hover:bg-shareai-teal/90"
        >
          Back to Reports
        </Button>
      </div>
    );
  }

  return null;
};

export default ReportLoadingState;
