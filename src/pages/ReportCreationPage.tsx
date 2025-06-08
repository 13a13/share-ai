
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReportCreationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-blue-900 mb-6">
          Create New Report
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>Start a new inspection report</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Report creation form will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportCreationPage;
