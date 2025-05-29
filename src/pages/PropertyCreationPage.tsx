
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyForm from "@/components/property/PropertyForm";
import PropertyLimitWarning from "@/components/PropertyLimitWarning";
import { usePropertyLimits } from "@/hooks/usePropertyLimits";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";

const PropertyCreationPage = () => {
  const navigate = useNavigate();
  const { canCreateNewProperty } = usePropertyLimits();
  const { canCreateProperties } = useSubscription();

  useEffect(() => {
    // Redirect if user can't create properties
    if (!canCreateProperties()) {
      navigate("/dashboard");
    }
  }, [canCreateProperties, navigate]);

  if (!canCreateProperties()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Trial Expired</CardTitle>
              <CardDescription>
                Your free trial has ended. Upgrade to continue creating properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-verifyvision-teal hover:bg-verifyvision-teal/90">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro - £15/month
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!canCreateNewProperty()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
          <p className="text-gray-600">Create a new property to start generating inspection reports.</p>
        </div>

        <PropertyLimitWarning />

        <div className="max-w-2xl mx-auto">
          <PropertyForm />
        </div>
      </div>
    </div>
  );
};

export default PropertyCreationPage;
