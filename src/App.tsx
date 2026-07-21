import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { UploadProgressProvider } from "./contexts/UploadProgressContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ParticlesBackground from "./components/ParticlesBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailVerificationGuard from "./components/EmailVerificationGuard";
import useDocumentTitle from "./hooks/useDocumentTitle";
import AuthRedirectHandler from "./components/AuthRedirectHandler";
import ScrollToTop from "./components/ScrollToTop";
import { initializeSettings } from "./utils/adminSettingsManager";

// Lazy load pages for better code splitting
const Home = lazy(() => import("./pages/Home"));
const Events = lazy(() => import("./pages/EventsRedesigned"));
const Auth = lazy(() => import("./pages/Auth"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CoreTeam = lazy(() => import("./pages/CoreTeam"));
const About = lazy(() => import("./pages/About"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogView = lazy(() => import("./pages/BlogView"));
const WriteBlog = lazy(() => import("./pages/WriteBlog"));
const SessionExpired = lazy(() => import("./pages/SessionExpired"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
});

const AppContent = () => {
  useDocumentTitle();
  const location = useLocation();

  // Initialize admin settings from database on app startup
  useEffect(() => {
    initializeSettings();
  }, []);
  const isAdminRoute = location.pathname === '/admin';

  if (isAdminRoute) {
    return (
      <div className="min-h-screen">
        <ScrollToTop />
        <ParticlesBackground key={'test'} forceRestart={false} />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading Admin...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole={["admin", "core"]}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ScrollToTop />
      <ParticlesBackground key={'main'} forceRestart={false} />
      <AuthRedirectHandler />
      <Navigation />
      <main className="flex-grow pt-24" role="main">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/core" element={<CoreTeam />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogView />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute>
                  <Attendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/write-blog" 
              element={
                <ProtectedRoute requiredRole={["member", "co_head", "admin", "core"]}>
                  <WriteBlog />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UploadProgressProvider>
            <AppContent />
          </UploadProgressProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;