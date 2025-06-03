
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyForm from "@/components/property/PropertyForm";
import PropertyPageHeader from "@/components/property/PropertyPageHeader";
import PropertyLimitWarning from "@/components/PropertyLimitWarning";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";

const PropertyCreationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateNewProperty } = usePropertyLimits();
  const { canCreateProperties } = useSubscription();

  useEffect(() => {
    // Check authentication first
    if (!user) {
      console.log("User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }

    // Check subscription status
    if (!canCreateProperties()) {
      console.log("User cannot create properties (trial expired), staying on page to show upgrade message");
      // Don't redirect, show upgrade message instead
    }
  }, [user, canCreateProperties, navigate]);

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verifyvision-teal"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show trial expired message
  if (!canCreateProperties()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <PropertyPageHeader 
            title="Add New Property"
            description="Create a new property to start generating inspection reports."
          />
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Trial Expired</CardTitle>
              <CardDescription>
                Your free trial has ended. Upgrade to continue creating properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-verifyvision-teal hover:bg-verifyvision-teal/90 mb-3">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro - £15/month
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show property limit reached message
  if (!canCreateNewProperty()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <PropertyPageHeader 
            title="Add New Property"
            description="Create a new property to start generating inspection reports."
          />
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle>Property Limit Reached</CardTitle>
              <CardDescription>
                You've reached your property limit. Upgrade to create more properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-verifyvision-teal hover:bg-verifyvision-teal/90 mb-3">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro - £15/month
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/properties")}>
                Back to Properties
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show the property creation form
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <PropertyPageHeader 
          title="Add New Property"
          description="Enter the details of your property to create a record in the system."
        />

        <PropertyLimitWarning />

        <div className="max-w-2xl mx-auto">
          <PropertyForm onSuccess={() => {
            console.log("Property creation successful, navigating to properties page");
            navigate("/properties");
          }} />
        </div>
      </div>
    </div>
  );
};

export default PropertyCreationPage;
