
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const TrialStatusCard = () => {
  const { profile, getDaysLeft, isTrialExpired, isTrialActive, hasActiveSubscription } = useSubscription();

  if (!profile) return null;

  const daysLeft = getDaysLeft();
  const expired = isTrialExpired();
  const trialActive = isTrialActive();
  const hasSubscription = hasActiveSubscription();

  const getStatusBadge = () => {
    if (hasSubscription) {
      return <Badge className="bg-green-500 text-white"><Crown className="h-3 w-3 mr-1" />Active Subscription</Badge>;
    }
    if (trialActive) {
      return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />Free Trial</Badge>;
    }
    if (expired) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Trial Expired</Badge>;
    }
    return <Badge variant="secondary">Unknown Status</Badge>;
  };

  const getDescription = () => {
    if (hasSubscription) {
      return `You have access to ${profile.property_limit} properties with your active subscription.`;
    }
    if (trialActive) {
      return `${daysLeft} days remaining in your free trial. You can create up to ${profile.property_limit} properties.`;
    }
    if (expired) {
      return "Your free trial has expired. Upgrade to continue creating properties.";
    }
    return "Subscription status unknown.";
  };

  return (
    <Card className="border-l-4 border-l-verifyvision-teal">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription Status</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-3">
          {getDescription()}
        </CardDescription>
        
        {trialActive && daysLeft <= 7 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Your trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. 
              Upgrade now to continue accessing all features.
            </p>
          </div>
        )}

        {expired && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
            <p className="text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Your free trial has ended. Upgrade to continue creating and managing properties.
            </p>
          </div>
        )}

        {(expired || (trialActive && daysLeft <= 7)) && (
          <Button className="w-full bg-verifyvision-teal hover:bg-verifyvision-teal/90">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro - £15/month
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialStatusCard;
