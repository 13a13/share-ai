
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Property } from "@/types";

interface PropertyDetailsHeaderProps {
  property: Property;
}

const PropertyDetailsHeader = ({ property }: PropertyDetailsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center mb-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold text-verifyvision-blue">
        {property?.name || property?.address}
      </h1>
    </div>
  );
};

export default PropertyDetailsHeader;
