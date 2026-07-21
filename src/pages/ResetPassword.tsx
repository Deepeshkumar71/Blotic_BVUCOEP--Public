import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, CheckCircle2 } from "@/components/icons";
import { getMinPasswordLength, validatePasswordLength } from "@/utils/passwordValidation";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { quickPasswordUpdate } from "@/lib/quickPasswordReset";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    resetCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "" });
  const [resetComplete, setResetComplete] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetMethod, setResetMethod] = useState<'token' | 'code'>('token');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword, verifyResetToken, resetPasswordWithCode } = useAuth();
  const { toast } = useToast();

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const code = searchParams.get('code'); // Supabase uses 'code' parameter
  const email = searchParams.get('email');
  const method = searchParams.get('method');

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      const minLength = getMinPasswordLength();
      let score = 0;
      if (formData.password.length >= minLength) score += 1;
      if (/[A-Z]/.test(formData.password)) score += 1;
      if (/[0-9]/.test(formData.password)) score += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;

      let label = "";
      if (score <= 1) label = "Weak";
      else if (score <= 2) label = "Fair";
      else if (score <= 3) label = "Good";
      else label = "Strong";

      setPasswordStrength({ score, label });
    } else {
      setPasswordStrength({ score: 0, label: "" });
    }
  }, [formData.password]);

  // Determine reset method and verify token/email on component mount
  useEffect(() => {
    const checkAuthState = async () => {
      console.log('🔧 Checking auth state...');
      console.log('🔧 URL params:', { accessToken, refreshToken, code, email, method });
      console.log('🔧 Full URL:', window.location.href);
      console.log('🔧 Current pathname:', window.location.pathname);
      console.log('🔧 Current search:', window.location.search);
      console.log('🔧 Current hash:', window.location.hash);
      
      // Check for error parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      
      if (error) {
        console.error('❌ URL contains error:', { error, errorCode, errorDescription });
        if (errorCode === 'otp_expired') {
          console.error('❌ Reset link has expired');
          setTokenValid(false);
          return;
        }
      }
      
      if (method === 'code' && email) {
        console.log('📧 Using code method');
        setResetMethod('code');
        setTokenValid(true);
      } else if (code) {
        console.log('🔑 Using token method with code parameter');
        setResetMethod('token');
        
        // If we have a code, assume it's valid and proceed quickly
        console.log('⚡ Code parameter found, proceeding immediately');
        setTokenValid(true);
        
        // Still listen for auth state changes in background
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔧 Auth state changed:', event, session);
            if (event === 'PASSWORD_RECOVERY' || session?.user) {
              console.log('✅ Password recovery session established');
              setTokenValid(true);
            }
          }
        );

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } else {
        console.log('❌ No valid parameters found');
        setTokenValid(false);
      }
    };

    checkAuthState();
  }, [accessToken, refreshToken, code, email, method]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      resetPasswordSchema.parse(formData);

      if (resetMethod === 'code') {
        // Code-based reset using our custom system
        if (!email || !formData.resetCode) {
          throw new Error("Email and reset code are required");
        }

        console.log('🔧 Using custom code verification system...');
        const { error } = await resetPasswordWithCode(email, formData.resetCode, formData.password);

        if (error) {
          console.error("Password reset with code error:", error);
          
          let errorMessage = "Failed to reset password. Please try again.";
          
          if (error.message?.includes("Invalid or expired")) {
            errorMessage = "Invalid or expired reset code. Please request a new code.";
          } else if (error.message?.includes("weak password")) {
            errorMessage = "Password is too weak. Please choose a stronger password.";
          }

          toast({
            title: "Reset Failed",
            description: errorMessage,
            variant: "destructive",
            className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
          });
        } else {
          setResetComplete(true);
          toast({
            title: "Password Updated!",
            description: "Your password has been successfully updated.",
            className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
          });

          // Redirect to login after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        }
      } else {
        // Token-based reset - use quick method
        console.log('🔧 Starting quick password update...');
        
        // Use the simpler, faster method
        const { error } = await quickPasswordUpdate(formData.password);

        if (error) {
          console.error("Password update error:", error);
          
          let errorMessage = "Failed to update password. Please try again.";
          
          if (error.message?.includes("timed out")) {
            errorMessage = "Password update timed out. Please try clicking the reset link again.";
          } else if (error.message?.includes("expired") || error.message?.includes("invalid") || error.message?.includes("token")) {
            errorMessage = "Reset link has expired. Redirecting you to request a new one...";
            // Auto-redirect to forgot password page after showing error
            setTimeout(() => navigate("/forgot-password"), 3000);
          } else if (error.message?.includes("weak password")) {
            errorMessage = "Password is too weak. Please choose a stronger password.";
          } else if (error.message?.includes("same password")) {
            errorMessage = "New password must be different from your current password.";
          } else if (error.message?.includes("No valid session")) {
            errorMessage = "Session expired. Please click the reset link again.";
          }

          toast({
            title: "Reset Failed",
            description: errorMessage,
            variant: "destructive",
            className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
          });

          if (error.message?.includes("expired") || error.message?.includes("invalid")) {
            setTimeout(() => navigate("/forgot-password"), 2000);
          }
        } else {
          setResetComplete(true);
          toast({
            title: "Password Updated!",
            description: "Your password has been successfully updated.",
            className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
          });

          // Redirect to login after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
          className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Reset Link Expired
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                This password reset link has expired or has already been used. Please request a new password reset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success state
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Password Updated!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {resetMethod === 'code' ? (
                <>Enter your reset code and new password below.</>
              ) : (
                <>Enter your new password below.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {resetMethod === 'code' && (
                <div className="space-y-2">
                  <Label htmlFor="resetCode" className="text-white font-medium">
                    Reset Code
                  </Label>
                  <Input
                    id="resetCode"
                    name="resetCode"
                    type="text"
                    value={formData.resetCode}
                    onChange={handleChange}
                    className="bg-background/50 border-border/50 text-white placeholder:text-muted-foreground focus:border-primary text-center text-lg font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  {errors.resetCode && (
                    <p className="text-red-500 text-sm">{errors.resetCode}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background/50 border-border/50 text-white placeholder:text-muted-foreground focus:border-primary pr-12"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-1 bg-muted rounded-sm overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-sm ${
                          passwordStrength.label === "Weak" ? "w-1/4 bg-red-500" :
                          passwordStrength.label === "Fair" ? "w-2/4 bg-yellow-500" :
                          passwordStrength.label === "Good" ? "w-3/4 bg-green-500" :
                          passwordStrength.label === "Strong" ? "w-full bg-green-600" : ""
                        }`}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${
                      passwordStrength.label === "Weak" ? "text-red-500" :
                      passwordStrength.label === "Fair" ? "text-yellow-500" :
                      passwordStrength.label === "Good" ? "text-green-500" :
                      passwordStrength.label === "Strong" ? "text-green-600" : "text-muted-foreground"
                    }`}>
                      Password strength: {passwordStrength.label}
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-background/50 border-border/50 text-white placeholder:text-muted-foreground focus:border-primary pr-12"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.password || !formData.confirmPassword || (resetMethod === 'code' && !formData.resetCode)}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {resetMethod === 'code' ? 'Resetting Password...' : 'Updating Password...'}
                  </>
                ) : (
                  resetMethod === 'code' ? 'Reset Password' : 'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
