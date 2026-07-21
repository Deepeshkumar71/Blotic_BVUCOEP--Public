import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, Home } from "@/components/icons";

const SessionExpired = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any remaining session data
    localStorage.removeItem("lastActivityTime");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Session Expired</CardTitle>
          <CardDescription className="text-base mt-4">
            You have been automatically logged out due to inactivity. This is a security measure to protect your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              For your security, we automatically log out users after a period of inactivity. Please log in again to continue.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Log In Again
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionExpired;
