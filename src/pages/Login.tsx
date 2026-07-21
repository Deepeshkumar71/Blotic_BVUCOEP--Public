import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { validatePasswordLength } from "@/utils/passwordValidation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Show confirmation message from registration
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      showMessage("info", state.message);
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = () => {
    if (!email) {
      showMessage("error", "Please enter your email address");
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      showMessage("error", "Please enter a valid email address");
      return false;
    }
    
    if (!password) {
      showMessage("error", "Please enter your password");
      return false;
    }
    
    const passwordValidation = validatePasswordLength(password);
    if (!passwordValidation.isValid) {
      showMessage("error", passwordValidation.message);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showMessage("error", "Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          showMessage("error", "Please check your email and confirm your account before logging in.");
        } else {
          showMessage("error", error.message || "An error occurred during login");
        }
      } else {
        showMessage("success", "Welcome back! You have successfully logged in.");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      showMessage("error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow pt-0 md:pt-[12vh]">
        <section className="py-0 md:py-12 min-h-screen bg-transparent">
          <div className="max-w-5xl mx-auto px-4 md:px-5">
            <motion.div 
              initial={fadeInUp.initial}
              animate={fadeInUp.animate}
              transition={fadeInUp.transition}
              className="w-full"
            >
              <div 
                className="bg-[rgba(96,46,166,0.05)] border border-[rgba(204,117,219,0.2)] rounded-[20px] p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-lg w-full flex flex-col lg:flex-row gap-4 md:gap-8 items-stretch"
                style={{ 
                  background: 'rgba(96, 46, 166, 0.05)',
                  border: '1px solid rgba(204, 117, 219, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Header section - full width on mobile, left side on desktop */}
                <div className="w-full lg:flex-[0_0_55%] flex flex-col justify-center items-center text-center py-4 lg:py-8">
                  <div className="flex flex-col items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <img 
                      src="/images/blotic.png?v=2" 
                      alt="BLOTIC Logo" 
                      className="w-20 h-16 md:w-24 md:h-20 object-contain filter drop-shadow-[0_0_20px_rgba(204,117,219,0.5)]"
                      style={{
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 20px rgba(204, 117, 219, 0.5))'
                      }}
                    />
                    <h1 className="text-3xl md:text-4xl font-extrabold m-0 text-center">
                      Welcome Back
                    </h1>
                  </div>
                  <p className="text-center text-[#c9c4c4] text-base md:text-lg m-0 max-w-[350px]">
                    Sign in to access your BLOTIC account
                  </p>
                </div>

                {/* Form section - full width on mobile, right side on desktop */}
                <div className="w-full lg:flex-[0_0_40%] min-w-0 flex flex-col justify-center max-w-none lg:max-w-[700px]">
                  {/* Message Container */}
                  {message && (
                    <div 
                      className={`mb-6 p-4 rounded-[10px] border opacity-100 transform translate-y-0 transition-all duration-300 ${
                        message.type === "success" 
                          ? "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] text-[#22c55e]" 
                          : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-[#ef4444]"
                      }`}
                      style={{
                        background: message.type === "success" 
                          ? 'rgba(34, 197, 94, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                        border: message.type === "success" 
                          ? '1px solid rgba(34, 197, 94, 0.3)' 
                          : '1px solid rgba(239, 68, 68, 0.3)',
                        color: message.type === "success" ? '#22c55e' : '#ef4444'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`text-xl flex-shrink-0 ${message.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}`}></i>
                        <span className="font-medium leading-6">{message.text}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mb-6 md:mb-8 w-full">
                    <div className="mb-4 md:mb-6 relative">
                      <label 
                        htmlFor="email" 
                        className="flex items-center gap-2 mb-2 text-[#ffffff] font-medium text-sm md:text-base"
                        style={{ color: '#ffffff', fontWeight: 500 }}
                      >
                        <i className="fas fa-envelope text-[#cc75db] w-4 md:w-5" style={{ color: '#cc75db' }}></i>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                        className="w-full p-3 md:p-2.5 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-[8px] text-[#ffffff] text-base md:text-sm transition-all duration-300 font-sans"
                        style={{
                          background: 'rgba(96, 46, 166, 0.1)',
                          border: '1px solid rgba(204, 117, 219, 0.3)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: window.innerWidth < 768 ? '16px' : '0.9rem' // Prevent zoom on iOS
                        }}
                      />
                    </div>

                    <div className="mb-4 md:mb-6 relative">
                      <label 
                        htmlFor="password" 
                        className="flex items-center gap-2 mb-2 text-[#ffffff] font-medium text-sm md:text-base"
                        style={{ color: '#ffffff', fontWeight: 500 }}
                      >
                        <i className="fas fa-lock text-[#cc75db] w-4 md:w-5" style={{ color: '#cc75db' }}></i>
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                          className="w-full p-3 md:p-2.5 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded-[8px] text-[#ffffff] text-base md:text-sm transition-all duration-300 pr-12 md:pr-12 font-sans"
                          style={{
                            background: 'rgba(96, 46, 166, 0.1)',
                            border: '1px solid rgba(204, 117, 219, 0.3)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: window.innerWidth < 768 ? '16px' : '0.9rem' // Prevent zoom on iOS
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 md:right-4 bg-transparent border-none text-[#c9c4c4] cursor-pointer p-2 rounded transition-colors duration-300 hover:text-[#cc75db] touch-manipulation"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 my-4 md:my-6">
                      <label className="flex items-start gap-3 cursor-pointer text-[#c9c4c4] text-sm leading-6 touch-manipulation" style={{ color: '#c9c4c4', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="hidden"
                        />
                        <span 
                          className="w-5 h-5 bg-[rgba(96,46,166,0.1)] border border-[rgba(204,117,219,0.3)] rounded relative transition-all duration-300 flex-shrink-0 mt-0.5"
                          style={{
                            width: '20px',
                            height: '20px',
                            background: 'rgba(96, 46, 166, 0.1)',
                            border: '1px solid rgba(204, 117, 219, 0.3)',
                            borderRadius: '4px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {rememberMe && (
                            <span 
                              className="absolute left-1.5 top-0.5 w-1.5 h-2.5 border-solid border-white border-t-0 border-l-0 transform rotate-45"
                              style={{
                                position: 'absolute',
                                left: '6px',
                                top: '2px',
                                width: '6px',
                                height: '10px',
                                border: 'solid white',
                                borderWidth: '0 2px 2px 0',
                                transform: 'rotate(45deg)'
                              }}
                            ></span>
                          )}
                        </span>
                        Remember me
                      </label>
                      <Link 
                        to="/forgot-password" 
                        className="text-[#cc75db] no-underline transition-all duration-300 hover:text-[#ffffff] text-sm touch-manipulation"
                        style={{ color: '#cc75db', textDecoration: 'none', transition: 'all 0.3s ease' }}
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full p-2.5 md:p-3 text-base md:text-base justify-center items-center relative transition-all duration-300 bg-gradient-to-r from-[#602ea6] to-[#cc75db] text-white border-none rounded-[50px] cursor-pointer font-sans shadow-[0_5px_25px_rgba(96,46,166,0.4)] hover:transform hover:translate-y-[-2px] md:hover:translate-y-[-5px] hover:shadow-[0_10px_30px_rgba(96,46,166,0.6)] disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation active:transform active:translate-y-[1px]"
                      style={{
                        width: '100%',
                        fontSize: '1rem',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'linear-gradient(135deg, #602ea6, #cc75db)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '0 5px 25px rgba(96, 46, 166, 0.4)',
                        minHeight: '48px' // Minimum touch target size
                      }}
                    >
                      <span className={`transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`} style={{ transition: 'all 0.3s ease' }}>
                        Sign In
                      </span>
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-300">
                          <i className="fas fa-spinner fa-spin text-xl"></i>
                        </div>
                      )}
                    </button>
                  </form>

                  <div className="text-center mt-6 md:mt-8 text-[#c9c4c4]" style={{ color: '#c9c4c4' }}>
                    <p className="text-sm md:text-base">
                      Don't have an account?{" "}
                      <Link 
                        to="/register" 
                        className="text-[#cc75db] no-underline font-medium transition-all duration-300 hover:text-[#ffffff] touch-manipulation"
                        style={{ color: '#cc75db', textDecoration: 'none', fontWeight: 500, transition: 'all 0.3s ease' }}
                      >
                        Create Account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;