
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileCheck, Loader2, Save, Pen } from "lucide-react";
import { ShimmerButton } from "./ui/shimmer-button";
import SignatureDialog from "./SignatureDialog";

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
  const [showSignature, setShowSignature] = useState(false);

  const handleSignatureSave = (data: { name: string; date: string; signature: string }) => {
    // Here you would typically save the signature data
    console.log("Signature data:", data);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-verifyvision-blue">
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
          <>
            <Button 
              onClick={() => setShowSignature(true)}
              className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
            >
              <Pen className="h-4 w-4 mr-2" />
              Add Signature
            </Button>
            <ShimmerButton
              onClick={onComplete}
              disabled={isSaving}
              className="px-4 py-2 h-10"
              background="rgb(155, 135, 245)"
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
            </ShimmerButton>
          </>
        ) : (
          <ShimmerButton
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 h-10"
            background="rgb(155, 135, 245)"
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
          </ShimmerButton>
        )}
      </div>

      <SignatureDialog
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
};

export default ReportHeader;
