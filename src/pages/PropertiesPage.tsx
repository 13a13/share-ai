
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PropertiesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-blue-900 mb-6">
          Properties
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
            <CardDescription>Manage your property portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Property management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertiesPage;
