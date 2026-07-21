import { useState, lazy, Suspense, useEffect } from "react";
import { Loader2 } from "@/components/icons";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { fadeIn } from "@/utils/animations";
import { useSearchParams } from "react-router-dom";

// Lazy load admin components for better performance
const EventManagement = lazy(() => import("@/components/admin/EventManagement"));
const UserManagement = lazy(() => import("@/components/admin/UserManagement"));
const PhotoManagement = lazy(() => import("@/components/admin/PhotoManagement"));
const CustomAdminDashboard = lazy(() => import("@/components/admin/CustomAdminDashboard"));
const CoreTeamManagement = lazy(() => import("@/components/admin/CoreTeamManagement"));
const BlogsManagement = lazy(() => import("@/components/admin/BlogsManagement"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const WriteBlog = lazy(() => import("@/pages/WriteBlog"));

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <span className="ml-3 text-muted-foreground">Loading...</span>
  </div>
);

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useRoleCheck();
  const isAdmin = hasRole("admin");
  
  // Initialize from URL param, sessionStorage, or default to "dashboard"
  const getInitialTab = () => {
    const urlTab = searchParams.get("tab");
    const storedTab = sessionStorage.getItem("adminActiveTab");
    return urlTab || storedTab || "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Sync activeTab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  // Only sync URL changes to activeTab (don't update URL from state)
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomAdminDashboard />
          </Suspense>
        );
      case "users":
        if (hasRole("admin") || hasRole("core")) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <UserManagement />
            </Suspense>
          );
        }
        return null;
      case "events":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <EventManagement />
          </Suspense>
        );
      case "photos":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PhotoManagement />
          </Suspense>
        );
      case "core-team":
        if (isAdmin) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <CoreTeamManagement />
            </Suspense>
          );
        }
        return null;
      case "blogs":
        if (hasRole("admin") || hasRole("core")) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <BlogsManagement />
            </Suspense>
          );
        }
        return null;
      case "settings":
        if (hasRole("admin")) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <AdminSettings />
            </Suspense>
          );
        }
        return null;
      case "edit-blog":
        if (hasRole("admin") || hasRole("core")) {
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <WriteBlog />
            </Suspense>
          );
        }
        return null;
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomAdminDashboard />
          </Suspense>
        );
    }
  };

  // Handle tab change from navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <motion.div 
        initial={fadeIn.initial}
        animate={fadeIn.animate}
        transition={fadeIn.transition}
        className="w-full px-6 py-6 h-full"
      >
        {renderTabContent()}
      </motion.div>
    </AdminLayout>
  );
};

export default Admin;