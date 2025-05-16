
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Clipboard, Home, FileSpreadsheet, Calendar, PlusCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // If still checking authentication, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mx-auto mb-4" />
          <h2 className="text-xl font-medium">Loading your account...</h2>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: "Property Management",
      description: "Create and manage properties with details like bedrooms, bathrooms, and type.",
      icon: Home,
      action: () => navigate(isAuthenticated ? "/properties" : "/login")
    },
    {
      title: "Inspection Reports",
      description: "Generate detailed inspection reports with photos and component analysis.",
      icon: Clipboard,
      action: () => navigate(isAuthenticated ? "/reports" : "/login")
    },
    {
      title: "Room Components",
      description: "Document individual components with condition assessments and photos.",
      icon: FileSpreadsheet,
      action: () => navigate(isAuthenticated ? "/reports" : "/login")
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3">Property Inspection Assistant</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Simplify and streamline your property inspection workflows with our comprehensive inspection tool.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <ShimmerButton
            onClick={() => navigate(isAuthenticated ? "/properties/new" : "/login")}
            className="flex items-center justify-center gap-2"
            shimmerColor="rgba(255,255,255,0.2)"
            background="linear-gradient(135deg, rgb(155, 135, 245) 0%, rgb(126, 105, 171) 100%)"
          >
            <PlusCircle className="h-5 w-5" />
            {isAuthenticated ? "Add New Property" : "Get Started"}
          </ShimmerButton>

          <Button
            variant="outline"
            onClick={() => navigate(isAuthenticated ? "/reports" : "/login")}
            className="flex items-center justify-center gap-2"
          >
            <Calendar className="h-5 w-5" />
            {isAuthenticated ? "View Reports" : "Learn More"}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-md cursor-pointer" onClick={feature.action}>
              <CardHeader>
                <div className="p-2 rounded-full bg-verifyvision-teal/10 w-fit mb-2">
                  <feature.icon className="h-6 w-6 text-verifyvision-teal" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Getting Started Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Getting Started</h2>
        <div className="bg-gradient-to-r from-verifyvision-teal/10 to-verifyvision-blue/10 p-8 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-4">Welcome to Your Inspection Assistant</h3>
          <p className="mb-6">
            Start by adding your first property, then create inspection reports with detailed room assessments.
          </p>
          <Button 
            variant="default" 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="bg-verifyvision-teal hover:bg-verifyvision-teal/90"
          >
            {isAuthenticated ? "Go to Dashboard" : "Login to Get Started"}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
