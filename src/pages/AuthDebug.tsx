import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AuthDebug = () => {
  const { user, userProfile, loading } = useAuth();
  
  // Safe role checking
  let roleCheckData = { hasAdmin: false, hasCore: false, isSuperAdmin: false, isCore: false };
  let roleCheckError = null;
  
  try {
    const roleCheck = useRoleCheck();
    roleCheckData = {
      hasAdmin: roleCheck.hasRole("admin"),
      hasCore: roleCheck.hasRole("core"),
      isSuperAdmin: roleCheck.isSuperAdmin(),
      isCore: roleCheck.isCore()
    };
  } catch (error) {
    console.error("Role check error:", error);
    roleCheckError = error.message;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Auth State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
                <p><strong>User:</strong> {user ? "Logged in" : "Not logged in"}</p>
                <p><strong>Email:</strong> {user?.email || "N/A"}</p>
                <p><strong>User ID:</strong> {user?.id || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Profile:</strong> {userProfile ? "Loaded" : "Not loaded"}</p>
                <p><strong>Full Name:</strong> {userProfile?.full_name || "N/A"}</p>
                <p><strong>Role:</strong> {userProfile?.role || "N/A"}</p>
                <p><strong>Email:</strong> {userProfile?.email || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roleCheckError ? (
                  <p className="text-red-500"><strong>Role Check Error:</strong> {roleCheckError}</p>
                ) : (
                  <>
                    <p><strong>Is Admin:</strong> {roleCheckData.hasAdmin ? "Yes" : "No"}</p>
                    <p><strong>Is Core:</strong> {roleCheckData.hasCore ? "Yes" : "No"}</p>
                    <p><strong>Is Super Admin:</strong> {roleCheckData.isSuperAdmin ? "Yes" : "No"}</p>
                    <p><strong>Is Core Team:</strong> {roleCheckData.isCore ? "Yes" : "No"}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><Link to="/test-profile"><Button variant="outline">Test Profile (No Auth)</Button></Link></div>
                <div><Link to="/test-admin"><Button variant="outline">Test Admin (No Auth)</Button></Link></div>
                <div><Link to="/profile"><Button>Protected Profile</Button></Link></div>
                <div><Link to="/admin"><Button>Protected Admin</Button></Link></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify({ user, userProfile, loading }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebug;
