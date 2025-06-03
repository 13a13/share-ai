
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyForm from "@/components/property/PropertyForm";
import PropertyPageHeader from "@/components/property/PropertyPageHeader";
import { useAuth } from "@/contexts/AuthContext";

const PropertyCreationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check authentication first
    if (!user) {
      console.log("User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
  }, [user, navigate]);

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

  // Show the property creation form
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <PropertyPageHeader 
          title="Add New Property"
          description="Enter the details of your property to create a record in the system."
        />

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
