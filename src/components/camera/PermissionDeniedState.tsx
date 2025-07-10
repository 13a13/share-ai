
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";

interface PermissionDeniedStateProps {
  onClose: () => void;
}

const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({ onClose }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center max-w-md mx-auto">
      <div className="mb-6">
        <Settings className="h-16 w-16 mx-auto mb-4 opacity-75" />
        <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
        <p className="text-sm opacity-90 leading-relaxed">
          To take photos, please enable camera permissions for this website. 
        </p>
      </div>
      
      <div className="space-y-3 w-full">
        <div className="text-xs opacity-75 space-y-1">
          <p><strong>Chrome/Edge:</strong> Click the camera icon in the address bar</p>
          <p><strong>Firefox:</strong> Click the shield icon, then "Allow camera"</p>
          <p><strong>Safari:</strong> Safari → Settings → Websites → Camera</p>
        </div>
        
        <div className="flex flex-col gap-2 pt-4">
          <Button 
            onClick={handleRefresh}
            className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-white text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDeniedState;
