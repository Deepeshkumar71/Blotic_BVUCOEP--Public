import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useNavigate } from "react-router-dom";
// Removed complex verification guard - Supabase Auth handles email verification

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole,
  requiredPermission
}: ProtectedRouteProps) => {
  const { user, loading, userProfile } = useAuth();
  const { hasRole, hasPermission } = useRoleCheck();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ProtectedRoute] Auth state:', { 
      hasUser: !!user, 
      email: user?.email,
      loading, 
      hasProfile: !!userProfile,
      userRole: userProfile?.role
    });
    
    // Only redirect if loading is complete and there's no user
    if (!loading && !user) {
      console.log('[ProtectedRoute] No user found after loading, redirecting to /login');
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, userProfile]);

  // Show loading state while auth is initializing
  if (loading) {
    console.log('[ProtectedRoute] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    console.log('[ProtectedRoute] No user after loading complete');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.some(role => hasRole(role))
      : hasRole(requiredRole);
      
    if (!hasRequiredRole) {
      console.log('[ProtectedRoute] User does not have required role:', requiredRole);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background pt-24">
          <div className="text-center max-w-md px-4">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <button 
              onClick={() => navigate("/")} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log('[ProtectedRoute] User does not have required permission:', requiredPermission);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have the required permissions to access this page.</p>
          <button 
            onClick={() => navigate("/")} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Rendering protected content for:', user.email);
  // Simplified: Supabase Auth now handles email verification automatically
  return <>{children}</>;
};

export default ProtectedRoute;