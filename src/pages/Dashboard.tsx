
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-brand-blue-900">
            Welcome to VerifyVision AI
          </h1>
          <p className="text-gray-600">
            Hello {user?.email}! Your dashboard is ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
              <CardDescription>Manage your property portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">View and manage your properties here.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Property inspection reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Access your inspection reports here.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Manage your account settings here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
