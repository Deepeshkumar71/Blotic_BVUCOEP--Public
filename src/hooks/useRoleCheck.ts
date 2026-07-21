import { useAuth } from "@/hooks/useAuth";
import { detectUserRole } from "@/utils/productionFixes";

export const useRoleCheck = () => {
  const { user, userProfile } = useAuth();

  const hasRole = (role: string) => {
    if (!user || !userProfile) return false;
    
    // Check if user has the specified role
    if (role === "admin") {
      return userProfile.role === "admin" || user.email === "bloticbvducoep@gmail.com" || user.email === "bloticbvucoep@gmail.com";
    }
    
    if (role === "core") {
      return userProfile.role === "core" || userProfile.role === "admin" || user.email === "bloticbvducoep@gmail.com" || user.email === "bloticbvucoep@gmail.com";
    }
    
    return userProfile.role === role;
  };

  const hasPermission = (permission: string) => {
    // Check if user has specific permissions based on their role
    if (!user || !userProfile) return false;
    
    // Super admin has all permissions
    if (userProfile.role === "admin" || user.email === "bloticbvducoep@gmail.com" || user.email === "bloticbvucoep@gmail.com") {
      return true;
    }
    
    // Core team has limited permissions
    if (userProfile.role === "core") {
      const corePermissions = [
        "manageUsers", "viewUsers", "updateUserRoles",
        "manageEvents", "createEvents", "editEvents", "deleteEvents",
        "managePhotos", "uploadPhotos", "editPhotos", "deletePhotos",
        "manageGallery", "readContent"
      ];
      return corePermissions.includes(permission);
    }
    
    // Map permissions to roles - using only valid database roles
    const permissionMap: Record<string, string[]> = {
      managePhotos: ["admin", "core"],
      manageEvents: ["admin", "core"],
      createEvents: ["admin", "core"],
      editEvents: ["admin", "core"],
      deleteEvents: ["admin", "core"],
      manageGallery: ["admin", "core"],
      uploadPhotos: ["admin", "core"],
      readContent: ["admin", "core", "member"],
    };
    
    const requiredRoles = permissionMap[permission] || [];
    return requiredRoles.includes(userProfile.role || "");
  };

  const isSuperAdmin = () => {
    if (!user) return false;
    
    // Use enhanced role detection with fallback
    const detectedRole = detectUserRole(userProfile, user.email);
    const isAdmin = detectedRole === "admin" || 
                   userProfile?.role === "admin" || 
                   user.email === "bloticbvducoep@gmail.com" || 
                   user.email === "bloticbvucoep@gmail.com";
    
    if (isAdmin) {
      console.log('✅ Super admin access granted for:', user.email);
    }
    
    return isAdmin;
  };

  const isPresident = () => {
    if (!userProfile) return false;
    return userProfile.role === "president";
  };

  const isSocialMediaHead = () => {
    if (!userProfile) return false;
    return userProfile.role === "social_media_head";
  };

  const isCore = () => {
    if (!userProfile) return false;
    return userProfile.role === "core";
  };

  const isMember = () => {
    if (!userProfile) return false;
    return userProfile.role === "member" || userProfile.role === "student" || !userProfile.role;
  };

  const isStudent = () => {
    if (!userProfile) return false;
    return userProfile.role === "student";
  };

  const canUpdateUserRole = (targetRole: string) => {
    if (!userProfile) return false;
    
    // Super admin can update any role
    if (userProfile.role === "admin" || user?.email === "bloticbvducoep@gmail.com" || user?.email === "bloticbvucoep@gmail.com") {
      return true;
    }
    
    // Core team can promote users from student up to core level
    // They can assign: student, member, co_head, and core roles
    if (userProfile.role === "core") {
      const allowedRoles = ["core", "co_head", "member", "student"];
      return allowedRoles.includes(targetRole);
    }
    
    return false;
  };

  return {
    hasRole,
    hasPermission,
    isSuperAdmin,
    isPresident,
    isSocialMediaHead,
    isCore,
    isMember,
    isStudent,
    canUpdateUserRole,
  };
};