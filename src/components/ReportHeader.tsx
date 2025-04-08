
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileCheck, Loader2, Save } from "lucide-react";

interface ReportHeaderProps {
  title: string;
  address: string;
  status: string;
  isSaving: boolean;
  onSave: () => void;
  onComplete?: () => void;
}

const ReportHeader = ({ 
  title, 
  address, 
  status, 
  isSaving, 
  onSave, 
  onComplete 
}: ReportHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-shareai-blue">
          {title}
        </h1>
        <p className="text-gray-600">
          {address}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        {status === "pending_review" && onComplete ? (
          <Button 
            onClick={onComplete}
            disabled={isSaving}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Complete Report
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={onSave}
            disabled={isSaving}
            className="bg-shareai-teal hover:bg-shareai-teal/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportHeader;
