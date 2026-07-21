import { ReactNode } from "react";
import AdminNavigation from "./AdminNavigation";
import AdminBreadcrumbs from "./AdminBreadcrumbs";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminLayout = ({ children, activeTab, onTabChange }: AdminLayoutProps) => {
  return (
    <div className="admin-layout h-screen bg-background flex flex-col">
      <AdminNavigation activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Spacer for fixed navigation */}
      <div className="pt-28">
        <AdminBreadcrumbs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
