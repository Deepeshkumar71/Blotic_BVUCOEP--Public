import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Phone, GraduationCap, Calendar, Cog } from "@/components/icons";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logRegistrationAttempt } from "@/utils/registrationUtils";
import { simpleRegistration } from "@/utils/simpleRegistration";
import { getMinPasswordLength } from "@/utils/passwordValidation";
import { isRegistrationEnabled } from "@/utils/adminSettingsManager";

// Dynamic password validation based on admin settings
const getRegisterSchema = () => {
  const minPasswordLength = getMinPasswordLength();
  
  return z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
      .refine((val) => /^[0-9]+$/.test(val), "Phone number must contain only numbers"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(minPasswordLength, `Password must be at least ${minPasswordLength} characters`),
    branch: z.string().min(1, "Please select a branch"),
    year: z.string().min(1, "Please select an academic year"),
    agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
  });
};

const Register = () => {
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    branch: "",
    year: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "" });
  const [verificationCode, setVerificationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [resending, setResending] = useState(false);
  const { signUp, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);

  // Check if registration is enabled in admin settings
  useEffect(() => {
    const checkRegistrationStatus = () => {
      const isEnabled = isRegistrationEnabled();
      setRegistrationEnabled(isEnabled);
      console.log('📋 Registration enabled:', isEnabled);
    };

    // Check on mount
    checkRegistrationStatus();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      checkRegistrationStatus();
    };

    window.addEventListener('adminSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('adminSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      let score = 0;
      if (formData.password.length >= 8) score += 1;
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

  // Countdown timer for verification code
  useEffect(() => {
    if (currentStep !== 4 || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, timeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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

  const validateStep = (step: number) => {
    // Only validate fields for the current step
    const minPasswordLength = getMinPasswordLength();
    
    const stepSchemas = {
      1: z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(1, "Last name is required"),
        phone: z.string().min(10, "Phone number must be at least 10 digits"),
      }),
      2: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(minPasswordLength, `Password must be at least ${minPasswordLength} characters`),
      }),
      3: z.object({
        branch: z.string().min(1, "Please select a branch"),
        year: z.string().min(1, "Please select an academic year"),
        agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
      }),
    };

    try {
      const currentSchema = stepSchemas[step as keyof typeof stepSchemas];
      const stepData = {
        1: { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
        2: { email: formData.email, password: formData.password },
        3: { branch: formData.branch, year: formData.year, agreeTerms: formData.agreeTerms }
      };
      
      currentSchema.parse(stepData[step as keyof typeof stepData]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps before submission
    const allStepsValid = validateStep(1) && validateStep(2) && validateStep(3);
    if (!allStepsValid) {
      setLoading(false);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    setLoading(true);
    console.log("🚀 Form submitted, starting registration...");

    try {
      // Prepare additional data for registration
      const additionalData = {
        phone: formData.phone,
        branch: formData.branch,
        year: parseInt(formData.year) || null,
        firstName: formData.firstName,
        lastName: formData.lastName
      };

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      console.log("📝 Registration data prepared:", {
        email: formData.email,
        fullName,
        phone: formData.phone,
        branch: formData.branch,
        year: formData.year
      });
      
      // Clear browser storage to prevent conflicts (no signOut call)
      console.log("🧹 Clearing browser storage...");
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
        console.log("✅ Storage cleanup completed");
      } catch (cleanupError) {
        console.log("⚠️ Storage cleanup had issues:", cleanupError);
      }
      
      // Use client-side signup directly
      console.log("🔐 Calling signUp function with:", {
        email: formData.email,
        fullName,
        additionalData
      });
      
      // Try simple registration first (more reliable)
      console.log("🔄 About to call simpleRegistration...");
      console.log("📋 Data being passed:", {
        email: formData.email,
        password: "***hidden***",
        fullName,
        additionalData
      });
      
      // Add timeout to prevent hanging
      const registrationPromise = simpleRegistration(formData.email, formData.password, fullName, additionalData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          console.log("⏰ Registration timeout reached");
          reject(new Error('Registration timeout - please try again'));
        }, 15000) // 15 second timeout
      );
      
      const simpleResult = await Promise.race([registrationPromise, timeoutPromise]) as Awaited<ReturnType<typeof simpleRegistration>>;
      console.log("📊 Simple registration returned:", simpleResult);
      console.log("📊 Result type:", typeof simpleResult);
      console.log("📊 Result keys:", simpleResult ? Object.keys(simpleResult) : 'null');
      
      // Check if result is valid
      if (!simpleResult || typeof simpleResult !== 'object') {
        throw new Error('Invalid registration response: ' + JSON.stringify(simpleResult));
      }
      
      if (simpleResult.success) {
        console.log("✅ Simple registration successful");
        
        const autoSignedIn = 'autoSignedIn' in simpleResult ? simpleResult.autoSignedIn : false;
        const requiresVerification = 'requiresVerification' in simpleResult ? simpleResult.requiresVerification : true;
        const message = 'message' in simpleResult ? simpleResult.message : 'Registration successful!';
        
        // Log successful registration
        await logRegistrationAttempt(
          formData.email,
          fullName,
          formData.phone,
          formData.branch,
          parseInt(formData.year) || null,
          true,
          null,
          autoSignedIn,
          autoSignedIn
        );
        
        // Check if email verification is required
        if (!requiresVerification && autoSignedIn) {
          // Email verification disabled - auto-login user
          console.log("🎉 Email verification disabled - logging user in automatically");
          
          // Set session if available
          if ('session' in simpleResult && simpleResult.session) {
            console.log("🔐 Setting session for auto-login...");
            try {
              const { supabase } = await import('@/integrations/supabase/client');
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: simpleResult.session.access_token,
                refresh_token: simpleResult.session.refresh_token,
              });
              
              if (sessionError) {
                console.error("❌ Failed to set session:", sessionError);
                toast({
                  title: "Session Error",
                  description: "Please login manually",
                  variant: "destructive",
                });
                navigate('/login');
                return;
              } else {
                console.log("✅ Session set successfully - user is now logged in");
              }
            } catch (sessionSetError) {
              console.error("❌ Exception setting session:", sessionSetError);
              navigate('/login');
              return;
            }
          }
          
          toast({
            title: "Welcome to BLOTIC!",
            description: "Registration successful! Redirecting to dashboard...",
            className: "bg-green-600 text-white",
          });
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
          return;
        }
        
        // Email verification required - send verification code
        console.log("📧 Sending verification code...");
        const verifyResponse = await fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/send-verification-code', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email: formData.email,
            user_id: simpleResult.userId || 'unknown'
          })
        });
        
        if (verifyResponse.ok) {
          console.log("✅ Verification code sent");
          setUserId(simpleResult.userId || null);
          setTimeLeft(900);
          setCurrentStep(4);
          toast({
            title: "Check Your Email!",
            description: "We've sent a 6-digit verification code to your email",
            className: "bg-green-600 text-white",
          });
        } else {
          console.warn("⚠️ Failed to send verification code");
          toast({
            title: "Registration Successful!",
            description: "Please check your email for verification",
            className: "bg-green-600 text-white",
          });
          if (simpleResult.shouldRedirect) {
            navigate(simpleResult.shouldRedirect);
          }
        }
        return;
      } else {
        console.log("❌ Simple registration failed:", simpleResult);
        
        // Convert error to string if it's an object
        const error = 'error' in simpleResult ? simpleResult.error : 'Registration failed. Please try again.';
        let errorMessage = 'Registration failed. Please try again.';
        
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          const errorObj = error as Record<string, unknown>;
          errorMessage = errorObj.message ? String(errorObj.message) : JSON.stringify(error);
        }
        
        // Log failed registration
        await logRegistrationAttempt(
          formData.email,
          fullName,
          formData.phone,
          formData.branch,
          parseInt(formData.year) || null,
          false,
          errorMessage,
          false,
          false
        );
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
          className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
        });
        
        if (simpleResult.shouldRedirect) {
          navigate(simpleResult.shouldRedirect);
        }
        return;
      }
      
    } catch (error) {
      console.error("❌ Unexpected registration error:", error);
      
      // Extract meaningful error message
      let errorMessage = "An unexpected error occurred during registration";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as Record<string, unknown>).message);
      }
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      console.log("🏁 Registration process completed, setting loading to false");
      setLoading(false);
    }
  };


  const branches = [
    "CSE", "CSBS", "CE", "IT", "ECE", "E&TC", 
    "MECHANICAL", "CHEMICAL", "CIVIL", "OTHER"
  ];

  const years = [
    { value: "1", label: "First Year" },
    { value: "2", label: "Second Year" },
    { value: "3", label: "Third Year" },
    { value: "4", label: "Fourth Year" }
  ];


  // Show disabled message if registration is turned off
  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/blotic.png?v=2" 
                alt="BLOTIC Logo" 
                className="w-24 h-20 object-contain filter drop-shadow-[0_0_20px_rgba(204,117,219,0.5)]" 
              />
            </div>
            <CardTitle className="text-2xl">Registration Currently Closed</CardTitle>
            <CardDescription className="text-base mt-4">
              New user registration is temporarily disabled. Please check back later or contact the administrators for more information.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Go to Login
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background">
      <div className="container mx-auto px-4 py-4 md:py-8 lg:py-16">
        <motion.div 
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={fadeInUp.transition}
          className="w-full max-w-6xl mx-auto"
        >
          <div className="registration-form-container bg-black/5 border border-[rgba(204,117,219,0.2)] rounded-2xl p-4 md:p-8 lg:p-12 shadow-[0_0_20px_rgba(204,117,219,0.2)] backdrop-blur-sm flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16">
          {/* Header section */}
          <div className="form-header md:flex-1 flex items-center justify-center text-center py-2 md:py-0">
            <div className="form-logo flex flex-col items-center gap-3 md:gap-4">
              <img 
                src="/images/blotic.png?v=2" 
                alt="BLOTIC Logo" 
                className="w-16 h-12 md:w-28 md:h-20 lg:w-36 lg:h-28 object-contain filter drop-shadow-[0_0_20px_rgba(204,117,219,0.5)]" 
              />
              <h1 className="hero-title text-xl md:text-4xl lg:text-5xl font-bold m-0 text-center leading-tight">
                Join <span className="bg-gradient-to-r from-[#cc75db] to-[#602ea6] bg-clip-text text-transparent">BLOTIC</span>
              </h1>
              <p className="hero-subtitle text-[#c0c0c0] text-xs md:text-lg lg:text-xl m-0 max-w-[450px] px-4 md:px-0 text-center">
                Become part of the blockchain revolution
              </p>
              
            </div>
          </div>

          {/* Registration form section */}
          <div className="registration-form flex-1 min-w-0 flex flex-col justify-center">
            {/* Step Progress Bar */}
            <div className="step-progress flex justify-between mb-8 relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-[rgba(204,117,219,0.2)] z-10"></div>
              {[1, 2, 3].map((step) => (
                <div 
                  key={step} 
                  className={`step-indicator flex flex-col items-center z-20 relative ${currentStep === step ? 'active' : currentStep > step ? 'completed' : ''}`}
                >
                  <div className={`step-number w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                    currentStep === step 
                      ? 'bg-[#cc75db] border-[#cc75db] text-[#602ea6]' 
                      : currentStep > step 
                        ? 'bg-[#cc75db] border-[#cc75db] text-[#602ea6]' 
                        : 'bg-[rgba(96,46,166,0.1)] border-[rgba(204,117,219,0.3)] text-white'
                  }`}>
                    {currentStep > step ? '✓' : step}
                  </div>
                  <div className={`step-label text-xs md:text-sm text-center w-20 md:w-24 ${
                    currentStep === step || currentStep > step ? 'text-[#cc75db] font-medium' : 'text-[#c0c0c0]'
                  }`}>
                    {step === 1 && 'Personal Info'}
                    {step === 2 && 'Account Details'}
                    {step === 3 && 'Complete'}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="form-step active block animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="form-group flex flex-col">
                      <Label htmlFor="firstName" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <User className="w-5 h-5 text-[#cc75db]" />
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.firstName}</span>}
                    </div>

                    <div className="form-group flex flex-col">
                      <Label htmlFor="lastName" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <User className="w-5 h-5 text-[#cc75db]" />
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <div className="form-group flex flex-col">
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <Phone className="w-5 h-5 text-[#cc75db]" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        onInput={(e) => {
                          // Only allow numbers and limit to 10 digits
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        }}
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                        placeholder="Enter 10-digit phone number"
                      />
                      {errors.phone && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.phone}</span>}
                    </div>
                  </div>
                  
                  <div className="step-navigation flex justify-between">
                    <div></div> {/* Empty div for spacing */}
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="min-w-32 bg-gradient-to-r from-[#cc75db] to-[#602ea6] text-white border-2 border-[#cc75db] rounded-lg font-medium transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 2 && (
                <div className="form-step active block animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="form-group flex flex-col">
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <Mail className="w-5 h-5 text-[#cc75db]" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                        placeholder="Enter your email address"
                      />
                      {errors.email && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.email}</span>}
                    </div>

                    <div className="form-group flex flex-col">
                      <Label htmlFor="password" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <svg className="w-5 h-5 text-[#cc75db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          ref={passwordRef}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full p-4 pr-12 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#c0c0c0] hover:text-[#cc75db] transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                        </button>
                      </div>
                      
                      {formData.password && (
                        <div className="mt-2">
                          <div className="w-full h-2 bg-[rgba(204,117,219,0.2)] rounded-sm overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 rounded-sm ${
                                passwordStrength.label === "Weak" ? "w-1/4 bg-red-500" :
                                passwordStrength.label === "Fair" ? "w-2/4 bg-yellow-500" :
                                passwordStrength.label === "Good" ? "w-3/4 bg-green-500" :
                                passwordStrength.label === "Strong" ? "w-full bg-green-600" : ""
                              }`}
                            ></div>
                          </div>
                          <div className={`text-xs mt-1 ${
                            passwordStrength.label === "Weak" ? "text-red-500" :
                            passwordStrength.label === "Fair" ? "text-yellow-500" :
                            passwordStrength.label === "Good" ? "text-green-500" :
                            passwordStrength.label === "Strong" ? "text-green-600" : "text-[#c0c0c0]"
                          }`}>
                            Password strength: {passwordStrength.label}
                          </div>
                        </div>
                      )}
                      {errors.password && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.password}</span>}
                    </div>
                  </div>
                  
                  <div className="step-navigation flex justify-between">
                    <Button 
                      type="button" 
                      onClick={prevStep}
                      className="min-w-32 bg-transparent text-white border-2 border-[rgba(204,117,219,0.3)] rounded-lg font-medium transition-all duration-300 hover:bg-[rgba(96,46,166,0.1)] hover:border-[#cc75db]"
                    >
                      Previous
                    </Button>
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="min-w-32 bg-gradient-to-r from-[#cc75db] to-[#602ea6] text-white border-2 border-[#cc75db] rounded-lg font-medium transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_20px_rgba(204,117,219,0.3)]"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Academic Information & Terms */}
              {currentStep === 3 && (
                <div className="form-step active block animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="form-group flex flex-col">
                      <Label htmlFor="branch" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <GraduationCap className="w-5 h-5 text-[#cc75db]" />
                        Branch / Department *
                      </Label>
                      <select
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)] appearance-none bg-no-repeat bg-right-4 bg-[length:1rem] pr-12"
                        style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cc75db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")" }}
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch} value={branch} className="bg-black text-white">{branch}</option>
                        ))}
                      </select>
                      {errors.branch && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.branch}</span>}
                    </div>

                    <div className="form-group flex flex-col">
                      <Label htmlFor="year" className="flex items-center gap-2 mb-2 text-white font-medium text-base">
                        <Calendar className="w-5 h-5 text-[#cc75db]" />
                        Academic Year *
                      </Label>
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full p-4 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-lg text-white transition-all duration-300 focus:outline-none focus:border-[#cc75db] focus:shadow-[0_0_20px_rgba(204,117,219,0.3)] appearance-none bg-no-repeat bg-right-4 bg-[length:1rem] pr-12"
                        style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cc75db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")" }}
                      >
                        <option value="">Select Year</option>
                        {years.map(year => (
                          <option key={year.value} value={year.value} className="bg-black text-white">{year.label}</option>
                        ))}
                      </select>
                      {errors.year && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.year}</span>}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="form-group flex flex-col mb-8">
                    <div className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="agreeTerms"
                        name="agreeTerms"
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="mt-1 w-5 h-5 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded text-[#cc75db] focus:ring-[#cc75db] focus:ring-offset-0"
                      />
                      <Label htmlFor="agreeTerms" className="text-[#c0c0c0] text-sm leading-relaxed">
                        I agree to the <a href="#" className="text-[#cc75db] hover:text-white transition-colors">Terms of Use</a> and <a href="#" className="text-[#cc75db] hover:text-white transition-colors">Privacy Policy</a> *
                      </Label>
                    </div>
                    {errors.agreeTerms && <span className="text-red-500 text-xs mt-1 min-h-[1.2rem]">{errors.agreeTerms}</span>}
                  </div>
                  
                  <div className="step-navigation flex justify-between">
                    <Button 
                      type="button" 
                      onClick={prevStep}
                      className="min-w-32 bg-transparent text-white border-2 border-[rgba(204,117,219,0.3)] rounded-lg font-medium transition-all duration-300 hover:bg-[rgba(96,46,166,0.1)] hover:border-[#cc75db]"
                    >
                      Previous
                    </Button>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="min-w-32 bg-gradient-to-r from-[#cc75db] to-[#602ea6] text-white border-2 border-[#cc75db] rounded-lg font-medium transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_20px_rgba(204,117,219,0.3)] flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Joining...
                        </>
                      ) : (
                        "Join BLOTIC"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Email Verification */}
              {currentStep === 4 && (
                <div className="step-content">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
                    <p className="text-[#c0c0c0]">
                      We've sent a 6-digit verification code to<br />
                      <strong className="text-purple-600">{formData.email}</strong>
                    </p>
                  </div>

                  <div className="form-group mb-6">
                    <Label htmlFor="verificationCode" className="text-[#c0c0c0] mb-3 block text-center">
                      Enter Verification Code
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-3xl tracking-widest font-mono bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] text-white focus:border-[#cc75db]"
                    />
                    <p className="text-sm text-center text-[#c0c0c0] mt-3">
                      Code expires in: <span className="font-mono font-bold text-purple-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      type="button"
                      onClick={async () => {
                        if (verificationCode.length !== 6) {
                          toast({
                            title: "Invalid Code",
                            description: "Please enter a 6-digit verification code",
                            variant: "destructive",
                          });
                          return;
                        }

                        setLoading(true);
                        try {
                          const { data, error } = await supabase
                            .from("email_verification_codes")
                            .select("*")
                            .eq("email", formData.email)
                            .eq("verification_code", verificationCode)
                            .is("verified_at", null)
                            .gt("expires_at", new Date().toISOString())
                            .order("created_at", { ascending: false })
                            .limit(1)
                            .single();

                          if (error || !data) {
                            toast({
                              title: "Invalid Code",
                              description: "The verification code is incorrect or expired",
                              variant: "destructive",
                            });
                            setLoading(false);
                            return;
                          }

                          await supabase
                            .from("email_verification_codes")
                            .update({ verified_at: new Date().toISOString() })
                            .eq("id", data.id);

                          // Auto-login the user
                          const { error: signInError } = await supabase.auth.signInWithPassword({
                            email: formData.email,
                            password: formData.password,
                          });

                          if (signInError) {
                            toast({
                              title: "Verification Successful!",
                              description: "Please login with your credentials",
                              className: "bg-green-600 text-white",
                            });
                            navigate("/login");
                            return;
                          }

                          // Send welcome email
                          fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/send-welcome-email', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                            },
                            body: JSON.stringify({
                              email: formData.email,
                              full_name: `${formData.firstName} ${formData.lastName}`,
                              user_id: userId
                            })
                          }).then(() => console.log("Welcome email sent"));

                          toast({
                            title: "Welcome to BLOTIC!",
                            description: "Your email has been verified successfully",
                            className: "bg-green-600 text-white",
                          });

                          navigate("/dashboard");
                        } catch (err) {
                          console.error(err);
                          toast({
                            title: "Error",
                            description: "Failed to verify code",
                            variant: "destructive",
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full bg-gradient-to-r from-[#cc75db] to-[#602ea6] text-white border-2 border-[#cc75db] rounded-lg font-medium py-3"
                    >
                      {loading ? "Verifying..." : "Verify Email"}
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        setResending(true);
                        try {
                          const response = await fetch('https://sbdrzesfuweacfssdwzk.supabase.co/functions/v1/send-verification-code', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                            },
                            body: JSON.stringify({ email: formData.email, user_id: userId })
                          });

                          if (response.ok) {
                            setTimeLeft(900);
                            toast({
                              title: "Code Resent",
                              description: "A new verification code has been sent to your email",
                              className: "bg-green-600 text-white",
                            });
                          }
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: "Failed to resend code",
                            variant: "destructive",
                          });
                        } finally {
                          setResending(false);
                        }
                      }}
                      disabled={resending || timeLeft > 840}
                      variant="outline"
                      className="w-full border-[rgba(204,117,219,0.3)] text-white hover:bg-[rgba(96,46,166,0.1)]"
                    >
                      {resending ? "Sending..." : "Resend Code"}
                    </Button>
                  </div>
                </div>
              )}

            </form>

            <div className="form-footer text-center mt-8 text-[#c0c0c0]">
              <p>Already have an account? <a href="/login" className="text-[#cc75db] hover:text-white transition-colors font-medium">Sign In</a></p>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;