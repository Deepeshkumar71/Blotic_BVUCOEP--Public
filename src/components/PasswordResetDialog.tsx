import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "@/components/icons";

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function PasswordResetDialog({ open, onOpenChange, email }: PasswordResetDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // 1 minute cooldown
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (!open || isVerified) return;

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
  }, [open, isVerified]);

  // Resend cooldown timer
  useEffect(() => {
    if (!open || canResend) return;

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
  }, [open, canResend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your email",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Verify code in database
      const { data: codes, error: fetchError } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("reset_code", verificationCode)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      console.log("Codes found:", codes);

      if (!codes || codes.length === 0) {
        console.log("No valid codes found for:", email, verificationCode);
        
        toast({
          title: "Invalid Code",
          description: "The code you entered is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from("password_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", codes[0].id);

      if (updateError) throw updateError;

      setIsVerified(true);
      toast({
        title: "Code Verified! ✅",
        description: "Now enter your new password",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify code";
      console.error("Error verifying code:", error);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
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

    setIsVerifying(true);

    try {
      // Call Edge Function to reset password using fetch
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
        throw new Error(data.error || 'Failed to reset password');
      }

      // Sign in the user automatically with new password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: newPassword,
      });

      if (signInError) {
        // If auto-login fails, that's okay - password was still reset
        toast({
          title: "Password Reset Successful! 🎉",
          description: "Please log in with your new password",
        });
        onOpenChange(false);
        navigate("/login");
        return;
      }

      toast({
        title: "Password Reset Successful! 🎉",
        description: "You have been logged in automatically",
      });

      onOpenChange(false);
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      console.error("Error resetting password:", error);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);

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
        throw new Error(data.error || 'Failed to resend code');
      }

      toast({
        title: "Code Resent! 📧",
        description: "A new verification code has been sent to your email",
      });

      // Reset timers
      setTimeLeft(900);
      setCanResend(false);
      setResendCooldown(60);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend verification code";
      console.error("Error resending code:", error);
      toast({
        title: "Failed to Resend",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[rgba(96,46,166,0.05)] border border-[rgba(204,117,219,0.2)] backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isVerified ? "🔐 Set New Password" : "📧 Verify Your Email"}
          </DialogTitle>
          <DialogDescription className="text-[#c9c4c4]">
            {isVerified
              ? "Enter your new password below"
              : `We sent a 6-digit code to ${email}`}
          </DialogDescription>
        </DialogHeader>

        {!isVerified ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-white">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={verificationCode}
                onChange={handleCodeInput}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db]"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#c9c4c4]">
                Time remaining: <strong className="text-[#cc75db]">{formatTime(timeLeft)}</strong>
              </span>
              {timeLeft === 0 && (
                <span className="text-red-400 font-medium">Code expired!</span>
              )}
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6 || timeLeft === 0}
              className="w-full bg-gradient-to-r from-[#602ea6] to-[#cc75db] hover:from-[#7a3ec4] hover:to-[#d88ee3] text-white"
            >
              {isVerifying ? (
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
                variant="link"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                className="text-sm text-[#cc75db] hover:text-[#d88ee3]"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : canResend ? (
                  "Resend Code"
                ) : (
                  `Resend in ${resendCooldown}s`
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white placeholder:text-[#c9c4c4] focus:border-[#cc75db]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={isVerifying || !newPassword || !confirmPassword}
              className="w-full bg-gradient-to-r from-[#602ea6] to-[#cc75db] hover:from-[#7a3ec4] hover:to-[#d88ee3] text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password & Login"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
