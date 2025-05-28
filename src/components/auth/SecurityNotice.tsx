
import { Shield } from "lucide-react";

const SecurityNotice = () => {
  return (
    <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2 mt-4">
      <Shield className="h-4 w-4 flex-shrink-0" />
      <span>Enhanced security with breach detection</span>
    </div>
  );
};

export default SecurityNotice;
