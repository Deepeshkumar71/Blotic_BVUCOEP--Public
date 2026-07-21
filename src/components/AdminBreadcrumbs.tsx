import { ChevronRight, Home, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AdminBreadcrumbsProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

const AdminBreadcrumbs = ({ activeTab, onTabChange }: AdminBreadcrumbsProps) => {
  const getBreadcrumbData = (tab: string) => {
    const breadcrumbMap: Record<string, { title: string; description: string }> = {
      dashboard: {
        title: "Dashboard",
        description: "Overview and analytics"
      },
      users: {
        title: "User Management",
        description: "Manage user accounts and roles"
      },
      events: {
        title: "Event Management",
        description: "Create and manage events"
      },
      attendance: {
        title: "Attendance",
        description: "QR code attendance system"
      },
      photos: {
        title: "Photo Management",
        description: "Manage gallery and event photos"
      },
      blogs: {
        title: "Blogs",
        description: "Manage blog posts and approvals"
      },
      "edit-blog": {
        title: "Edit Blog",
        description: "Edit blog post content and settings"
      },
      "write-blog": {
        title: "Write Blog",
        description: "Create new blog post content"
      },
      "core-team": {
        title: "Core Team",
        description: "Manage core team members"
      },
      settings: {
        title: "Settings",
        description: "Admin settings and configuration"
      }
    };

    return breadcrumbMap[tab] || { title: "Unknown", description: "" };
  };

  const currentPage = getBreadcrumbData(activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm border-b border-border/50 px-6 py-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm">
          {/* Home Link */}
          <Link 
            to="/" 
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="ml-2">Home</span>
          </Link>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          
          {/* Admin Section - Clickable to go to dashboard */}
          {activeTab === "dashboard" ? (
            // On dashboard page, show Admin as the final item (no chevron or Dashboard text)
            <span className="flex items-center text-foreground font-medium">
              <Shield className="w-4 h-4" />
              <span className="ml-2">Admin</span>
            </span>
          ) : (
            <>
              <button 
                onClick={() => onTabChange?.("dashboard")}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="ml-2">Admin</span>
              </button>
              
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              
              {/* Handle blog-related tabs to show Blogs > [Tab] hierarchy */}
              {(activeTab === "edit-blog" || activeTab === "write-blog") ? (
                <>
                  {/* Blogs Link */}
                  <button 
                    onClick={() => onTabChange?.("blogs")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blogs
                  </button>
                  
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  
                  {/* Current Page */}
                  <span className="text-foreground font-medium">
                    {activeTab === "edit-blog" ? "Edit Blog" : "Write Blog"}
                  </span>
                </>
              ) : (
                /* Current Page */
                <span className="text-foreground font-medium">
                  {currentPage.title}
                </span>
              )}
            </>
          )}
        </div>

        {/* Page Description & Status */}
        <div className="flex items-center gap-4">
          {currentPage.description && (
            <div className="hidden md:block text-sm text-muted-foreground">
              {currentPage.description}
            </div>
          )}
          
          {/* Admin Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-purple-400">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Mobile Description */}
      {currentPage.description && (
        <div className="md:hidden mt-2 text-sm text-muted-foreground">
          {currentPage.description}
        </div>
      )}
    </motion.div>
  );
};

export default AdminBreadcrumbs;
