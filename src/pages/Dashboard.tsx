
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="shareai-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-shareai-blue">Welcome, {user?.name || user?.email?.split('@')[0]}</h1>
        <p className="text-gray-600">
          Manage your property inventory reports efficiently with Share.AI
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Building2 className="h-12 w-12 text-shareai-teal mb-4" />
            <h2 className="text-xl font-bold mb-2">Properties</h2>
            <p className="text-gray-600 mb-6">
              Manage your properties and create detailed inventory reports.
            </p>
            <Button 
              onClick={() => navigate("/properties")}
              className="bg-shareai-teal hover:bg-shareai-teal/90 w-full"
            >
              View Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
