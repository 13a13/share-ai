
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home } from "lucide-react";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";
import { useSubscription } from "@/hooks/useSubscription";

const PropertyLimitWarning = () => {
  const { getPropertyLimitStatus } = usePropertyLimits();
  const { isTrialExpired, canCreateProperties } = useSubscription();
  
  const { current, limit, percentage } = getPropertyLimitStatus();

  if (!canCreateProperties()) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your free trial has expired. You cannot create new properties until you upgrade your subscription.
        </AlertDescription>
      </Alert>
    );
  }

  if (percentage >= 100) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You've reached your property limit ({current}/{limit}). Upgrade your subscription to create more properties.
        </AlertDescription>
      </Alert>
    );
  }

  if (percentage >= 80) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <Home className="h-4 w-4" />
        <AlertDescription className="text-yellow-800">
          You're approaching your property limit ({current}/{limit}). Consider upgrading soon.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default PropertyLimitWarning;
