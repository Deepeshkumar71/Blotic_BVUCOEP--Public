import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "@/components/icons";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL which contains the auth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "signup" && accessToken) {
          // Email verification callback
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            throw error;
          }

          setStatus("success");
          setMessage("Email verified successfully! Redirecting...");
          
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else if (type === "recovery") {
          // Password reset callback
          setStatus("success");
          setMessage("Redirecting to password reset...");
          
          setTimeout(() => {
            navigate("/reset-password");
          }, 2000);
        } else {
          // Default case - just redirect to home
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-2">Processing Authentication</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Success!</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
