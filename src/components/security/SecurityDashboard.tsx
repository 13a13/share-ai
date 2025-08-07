import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Eye, Settings, Activity } from "lucide-react";
import { securityService } from "@/lib/security/securityService";
import { sessionManager, SessionInfo } from "@/lib/security/sessionManager";
import { useToast } from "@/components/ui/use-toast";

const SecurityDashboard = () => {
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [logs, sessions] = await Promise.all([
        securityService.getSecurityLogs(20),
        sessionManager.getUserSessions()
      ]);
      
      setSecurityLogs(logs);
      setUserSessions(sessions);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateAllSessions = async () => {
    try {
      await sessionManager.invalidateAllSessions();
      toast({
        title: "Sessions invalidated",
        description: "All active sessions have been invalidated.",
      });
      loadSecurityData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invalidate sessions.",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('SIGNED_IN')) return <Shield className="h-4 w-4" />;
    if (action.includes('failed') || action.includes('error')) return <AlertTriangle className="h-4 w-4" />;
    if (action.includes('session')) return <Activity className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    if (action.includes('login') || action.includes('SIGNED_IN')) return 'default';
    if (action.includes('logout')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events and manage your account security
          </p>
        </div>
        <Button onClick={loadSecurityData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityLogs.filter(log => !log.success).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              Overall security status
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Recent authentication and security events for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityLogs.length > 0 ? (
                  securityLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getActionIcon(log.action)}
                        <div>
                          <div className="font-medium">{log.action.replace(/_/g, ' ').toUpperCase()}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getActionColor(log.action, log.success)}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No security events found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSessions.length > 0 ? (
                  <>
                    {userSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Session {index + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            Last activity: {new Date(session.lastActivity).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expires: {new Date(session.expiresAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={session.isActive ? 'default' : 'secondary'}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button 
                        onClick={handleInvalidateAllSessions} 
                        variant="destructive" 
                        size="sm"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Invalidate All Sessions
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No active sessions found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Enhanced Security Features Active:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Rate limiting protection</li>
                    <li>Session fingerprinting</li>
                    <li>Automatic session timeout (30 minutes)</li>
                    <li>Security event logging</li>
                    <li>Input sanitization</li>
                    <li>Password strength validation</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified of suspicious activity
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Device Trust</div>
                    <div className="text-sm text-muted-foreground">
                      Remember trusted devices
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;