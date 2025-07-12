
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home } from "lucide-react";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";
import { useSubscription } from "@/hooks/useSubscription";

const PropertyLimitWarning = () => {
  // No limitations - return null to hide all warnings
  return null;
};

export default PropertyLimitWarning;
