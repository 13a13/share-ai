
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PropertyDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-blue-900 mb-6">
          Property Details
        </h1>
        <p className="text-gray-600 mb-6">Property ID: {id}</p>
        
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>Detailed view of your property</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Property details will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
