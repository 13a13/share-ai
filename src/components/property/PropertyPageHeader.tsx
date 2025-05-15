
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type PropertyPageHeaderProps = {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
};

const PropertyPageHeader = ({ 
  title, 
  description = 'Enter the details of your property to create a record in the system.',
  backLink = "/properties",
  backLabel = "Back to Properties"
}: PropertyPageHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      {backLink && (
        <Button variant="ghost" onClick={() => navigate(backLink)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backLabel}
        </Button>
      )}
      <h1 className="text-3xl font-bold text-verifyvision-blue flex items-center">
        <Building2 className="h-7 w-7 mr-2" />
        {title}
      </h1>
      {description && (
        <p className="text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};

export default PropertyPageHeader;
