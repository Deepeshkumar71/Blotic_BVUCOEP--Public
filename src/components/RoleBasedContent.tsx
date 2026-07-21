import { useRoleCheck } from "@/hooks/useRoleCheck";

interface RoleBasedContentProps {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedContent = ({ 
  permission, 
  role, 
  children, 
  fallback = null 
}: RoleBasedContentProps) => {
  const { hasPermission, hasRole } = useRoleCheck();

  // If a permission is specified, check for that permission
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // If a role is specified, check for that role
  if (role) {
    return hasRole(role) ? <>{children}</> : <>{fallback}</>;
  }

  // If neither is specified, show the content
  return <>{children}</>;
};

export default RoleBasedContent;