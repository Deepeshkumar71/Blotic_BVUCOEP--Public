import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from "@/components/icons";
import { z } from "zod";
import { validatePasswordLength } from "@/utils/passwordValidation";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type Step = "email" | "code" | "password";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Timer for code expiration
  useEffect(() => {
    if (step !== "code") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (step !== "code" || canResend) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, canResend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      forgotPasswordSchema.parse({ email });

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your_supabase_anon_key";
      const response = await fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/send-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast({
          title: "Failed to Send Code",
          description: data.error || "Failed to send reset code.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code Sent! 📧",
        description: "Check your email for the verification code",
      });

      setStep("code");
      setTimeLeft(900);
      setCanResend(false);
      setResendCooldown(60);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: codes, error } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("reset_code", verificationCode)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !codes || codes.length === 0) {
        toast({
          title: "Invalid Code",
          description: "The code is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      // Mark as used
      await supabase
        .from("password_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", codes[0].id);

      toast({
        title: "Code Verified! ✅",
        description: "Now enter your new password",
      });

      setStep("password");
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordValidation = validatePasswordLength(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your_supabase_anon_key";
      const response = await fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email,
          verificationCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast({
          title: "Reset Failed",
          description: data.error || "Failed to reset password",
          variant: "destructive",
        });
        return;
      }

      // Auto-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });

      if (signInError) {
        toast({
          title: "Password Reset! 🎉",
          description: "Please log in with your new password",
        });
        navigate("/login");
        return;
      }

      toast({
        title: "Success! 🎉",
        description: "Password reset and logged in",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your_supabase_anon_key";
      const response = await fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/send-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast({
          title: "Failed to Resend",
          description: data.error || "Failed to resend code",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code Resent! 📧",
        description: "A new code has been sent to your email",
      });

      setTimeLeft(900);
      setCanResend(false);
      setResendCooldown(60);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24">
      <div className="w-full max-w-md">
        <Card className="bg-[rgba(96,46,166,0.05)] border border-[rgba(204,117,219,0.2)] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[rgba(204,117,219,0.1)] rounded-full flex items-center justify-center border border-[rgba(204,117,219,0.3)]">
              {step === "password" ? (
                <CheckCircle className="w-8 h-8 text-[#cc75db]" />
              ) : (
                <Mail className="w-8 h-8 text-[#cc75db]" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === "email" && "Forgot Password?"}
              {step === "code" && "Verify Code"}
              {step === "password" && "Set New Password"}
            </CardTitle>
            <CardDescription className="text-[#c9c4c4]">
              {step === "email" && "Enter your email to receive a verification code"}
              {step === "code" && `We sent a 6-digit code to ${email}`}
              {step === "password" && "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db] rounded-[8px]"
                    placeholder="Enter your email"
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-[#602ea6] to-[#cc75db] hover:from-[#7a3ec4] hover:to-[#d88ee3] text-white font-medium rounded-[8px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Code"
                  )}
                </Button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db] rounded-[8px]"
                    placeholder="000000"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#c9c4c4]">
                    Time: <strong className="text-[#cc75db]">{formatTime(timeLeft)}</strong>
                  </span>
                  {timeLeft === 0 && (
                    <span className="text-red-400 font-medium">Expired!</span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6 || timeLeft === 0}
                  className="w-full bg-gradient-to-r from-[#602ea6] to-[#cc75db] hover:from-[#7a3ec4] hover:to-[#d88ee3] text-white font-medium rounded-[8px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={!canResend || loading}
                    className="text-sm text-[#cc75db] hover:text-[#d88ee3]"
                  >
                    {loading ? (
                      "Sending..."
                    ) : canResend ? (
                      "Resend Code"
                    ) : (
                      `Resend in ${resendCooldown}s`
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db] rounded-[8px]"
                      placeholder="Enter new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[#c9c4c4]" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#c9c4c4]" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db] rounded-[8px]"
                      placeholder="Confirm new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-[#c9c4c4]" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#c9c4c4]" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-gradient-to-r from-[#602ea6] to-[#cc75db] hover:from-[#7a3ec4] hover:to-[#d88ee3] text-white font-medium rounded-[8px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password & Login"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm text-[#c9c4c4] hover:text-[#cc75db] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
