
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NoPropertiesStateProps {
  onAddProperty: () => void;
}

const NoPropertiesState = ({ onAddProperty }: NoPropertiesStateProps) => {
  return (
    <div className="text-center py-8">
      <h3 className="text-xl font-medium mb-2">No Properties Available</h3>
      <p className="text-gray-500 mb-4">
        You need to add a property before you can create a report.
      </p>
      <Button 
        onClick={onAddProperty}
        className="bg-shareai-teal hover:bg-shareai-teal/90"
      >
        Add Property
      </Button>
    </div>
  );
};

export default NoPropertiesState;
