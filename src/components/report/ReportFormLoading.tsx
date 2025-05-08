
import { Loader2 } from "lucide-react";

const ReportFormLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mb-4" />
      <p className="text-gray-500">Loading properties...</p>
    </div>
  );
};

export default ReportFormLoading;
