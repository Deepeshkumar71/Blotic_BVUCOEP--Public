import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Key, Lock, CheckCircle } from "@/components/icons";
import { validatePasswordLength } from "@/utils/passwordValidation";

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordNew() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendResetCode, verifyResetCode, resetPasswordWithCode } = useAuth();
  const navigate = useNavigate();

  // Step 1: Send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendResetCode(email);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Code Sent! 📧",
          description: "Check your email for the 6-digit reset code.",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
        setStep('code');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit reset code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyResetCode(email, code);
      
      if (error) {
        toast({
          title: "Invalid Code",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code Verified! ✅",
          description: "Now enter your new password.",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
        setStep('password');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
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
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPasswordWithCode(email, code, newPassword);
      
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Successful! 🎉",
          description: "You can now login with your new password.",
          className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
        });
        navigate('/login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/50"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? 'Sending Code...' : 'Send Reset Code 📧'}
            </Button>
          </form>
        );

      case 'code':
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to: <strong>{email}</strong>
              </p>
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-muted-foreground mb-2">
                Reset Code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-background/50 border-border/50 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? 'Verifying...' : 'Verify Code ✅'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('email')}
              className="w-full"
            >
              ← Back to Email
            </Button>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Code verified! Now set your new password.
              </p>
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background/50 border-border/50"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-border/50"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? 'Resetting...' : 'Reset Password 🔐'}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'email':
        return <Mail className="w-6 h-6 text-primary" />;
      case 'code':
        return <Key className="w-6 h-6 text-primary" />;
      case 'password':
        return <Lock className="w-6 h-6 text-primary" />;
      default:
        return <Mail className="w-6 h-6 text-primary" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Reset Password';
      case 'code':
        return 'Enter Reset Code';
      case 'password':
        return 'Set New Password';
      default:
        return 'Reset Password';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              {getStepIcon()}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {getStepTitle()}
            </CardTitle>
            <div className="flex justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${step === 'email' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'code' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'password' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}
            
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
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
}
