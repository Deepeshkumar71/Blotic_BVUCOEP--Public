import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Eye, Mail, Phone, GraduationCap, Calendar, Github, Linkedin, Instagram, X, Filter, Search } from "lucide-react";
import { highlightText } from "@/utils/highlightText";

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  branch?: string;
  year?: number;
  bio?: string;
  role?: string;
  avatar_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  created_at?: string;
  is_active?: boolean;
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { canUpdateUserRole, isSuperAdmin } = useRoleCheck();
  const { userProfile: currentUserProfile } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", currentUserProfile?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Filter out admin users if the current user is not a super admin
      const isAdmin = currentUserProfile?.role === 'admin';
      if (!isAdmin && data) {
        return data.filter(user => user.role !== 'admin');
      }
      
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log('[UserManagement] Updating role for user:', userId, 'to role:', role);
      
      // Validate role before sending to database (excluding admin - there can only be one leader)
      const validPromotionRoles = ["core", "co_head", "member", "student"];
      if (!validPromotionRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}. Must be one of: ${validPromotionRoles.join(', ')}`);
      }
      
      // Additional security check to prevent admin role assignment
      if (role === "admin") {
        throw new Error("Cannot promote users to admin role. There can only be one leader.");
      }
      
      // Keep the role as is since we now store "member" directly in the database
      const roleValue = role;
      
      // Use RPC function to update role (bypasses RLS with SECURITY DEFINER)
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: roleValue
      });
        
      if (error) {
        console.error('[UserManagement] Database error:', error);
        throw error;
      }
      
      console.log('[UserManagement] Role updated successfully');
      return { userId, role: roleValue };
    },
    onSuccess: () => {
      // Invalidate all user-related caches
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      
      // Force refetch of admin dashboard data
      queryClient.refetchQueries({ queryKey: ["admin-users"] });
      
      console.log('[UserManagement] Cache invalidated and refetch triggered');
      
      toast({
        title: "Success",
        description: "User role updated successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
      setEditingUserId(null);
      setNewRole("");
    },
    onError: (error) => {
      console.error('[UserManagement] Mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      setEditingUserId(null);
      setNewRole("");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('[UserManagement] Deleting user:', userId);
      
      // Use the database function to delete user (works with RLS)
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: userId
      });
      
      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
      
      return userId;
    },
    onSuccess: (deletedUserId) => {
      console.log('[UserManagement] User deleted successfully:', deletedUserId);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      
      toast({
        title: "Success",
        description: "User account deleted successfully",
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });
    },
    onError: (error) => {
      console.error('[UserManagement] Delete error:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    },
  });

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const handleRoleChange = (userId: string, role: string | null) => {
    setEditingUserId(userId);
    setNewRole(role || "student");
  };

  const saveRoleChange = (userId: string) => {
    if (!newRole) {
      toast({
        title: "Error",
        description: "Please select a role before saving",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const cancelRoleChange = () => {
    setEditingUserId(null);
    setNewRole("");
  };

  const getRoleOptions = () => {
    // Available roles for promotion (excluding admin - there can only be one leader)
    const promotionRoles = [
      { value: "core", label: "Core Team" },
      { value: "co_head", label: "Co-Head" },
      { value: "member", label: "Member" },
      { value: "student", label: "Student" }
    ];
    
    // Filter roles based on user's permission
    return promotionRoles.filter(role => canUpdateUserRole(role.value));
  };

  // Check if current user can edit a specific user's role
  const canEditUserRole = (targetUser: UserProfile) => {
    if (!currentUserProfile) return false;
    
    // Cannot edit own role
    if (currentUserProfile.id === targetUser.id) return false;
    
    // Admin can edit everyone except other admins
    if (currentUserProfile.role === 'admin') {
      return targetUser.role !== 'admin';
    }
    
    // Core members can upgrade users from student up to core level
    // But they CANNOT update other core members or admins
    if (currentUserProfile.role === 'core') {
      return ['co_head', 'member', 'student'].includes(targetUser.role || '');
    }
    
    // Other roles cannot edit anyone
    return false;
  };

  // Filter users based on selected role and search query
  const filteredUsers = users?.filter(user => {
    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const fullName = (user.full_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const branch = (user.branch || '').toLowerCase();
      const year = (user.year?.toString() || '').toLowerCase();
      
      return fullName.includes(query) || 
             email.includes(query) || 
             phone.includes(query) || 
             branch.includes(query) ||
             year.includes(query);
    }
    
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-0 sm:p-6"
    >
      <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                {isLoading ? '...' : filteredUsers?.length || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {filteredUsers?.length === 1 ? 'User' : 'Users'} {roleFilter !== "all" ? "Filtered" : "Registered"}
              </div>
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md order-2 sm:order-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, branch, or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 order-1 sm:order-2 sm:ml-auto">
              {roleFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleFilter("all")}
                  className="text-xs"
                >
                  Clear Filter
                </Button>
              )}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="core">Core Team</SelectItem>
                  <SelectItem value="co_head">Co-Heads</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                </SelectContent>
              </Select>
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers?.length || 0} of {users?.length || 0} users
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] pl-[60px]">Name</TableHead>
                    <TableHead className="min-w-[200px] pl-8">Email</TableHead>
                    <TableHead className="min-w-[120px] pl-8">Role</TableHead>
                    <TableHead className="min-w-[80px] pl-8">Year</TableHead>
                    <TableHead className="min-w-[100px] pl-8">Status</TableHead>
                    <TableHead className="min-w-[180px] pl-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={user.avatar_url || ""} 
                              alt={user.full_name}
                              className="object-cover w-full h-full"
                            />
                            <AvatarFallback>
                              {user.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[150px] truncate" title={user.full_name}>
                            {highlightText(user.full_name || "", searchQuery)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="pl-8">
                        <div className="max-w-[200px] truncate" title={user.email}>
                          {highlightText(user.email || "", searchQuery)}
                        </div>
                      </TableCell>
                      <TableCell className="pl-8">
                        {editingUserId === user.id ? (
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {getRoleOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              user.role === "admin" ? "destructive" :
                              user.role === "core" ? "default" :
                              user.role === "co_head" ? "secondary" :
                              "outline"
                            }
                          >
                            {user.role === "admin" ? "Admin" :
                             user.role === "core" ? "Core Team" :
                             user.role === "co_head" ? "Co-Head" :
                             user.role === "student" ? "Student" :
                             user.role === "member" ? "Member" :
                             "Unknown"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pl-8">{user.year || "N/A"}</TableCell>
                      <TableCell className="pl-8">
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-2">
                          {editingUserId === user.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => saveRoleChange(user.id)}
                                disabled={updateRoleMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelRoleChange}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingProfile(user)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              {canEditUserRole(user) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, user.role || "user")}
                                >
                                  Edit Role
                                </Button>
                              )}
                              {isSuperAdmin() && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[15vh]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{user.full_name}</strong>'s account? 
                                        This action cannot be undone and will permanently remove all user data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        Delete Account
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredUsers?.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="space-y-3">
                    {/* User Info Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage 
                            src={user.avatar_url || ""} 
                            alt={user.full_name}
                            className="object-cover w-full h-full"
                          />
                          <AvatarFallback>
                            {user.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate" title={user.full_name}>
                            {highlightText(user.full_name || "", searchQuery)}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate" title={user.email}>
                            {highlightText(user.email || "", searchQuery)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className="flex-shrink-0"
                        variant={user.is_active ? "default" : "destructive"}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Role and Year */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        {editingUserId === user.id ? (
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {getRoleOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              user.role === "admin" ? "destructive" :
                              user.role === "core" ? "default" :
                              user.role === "co_head" ? "secondary" :
                              "outline"
                            }
                          >
                            {user.role === "admin" ? "Admin" :
                             user.role === "core" ? "Core Team" :
                             user.role === "co_head" ? "Co-Head" :
                             user.role === "student" ? "Student" :
                             user.role === "member" ? "Member" :
                             "Unknown"}
                          </Badge>
                        )}
                      </div>
                      {user.year && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Year:</span>
                          <span className="text-sm font-medium">{user.year}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {editingUserId === user.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveRoleChange(user.id)}
                            disabled={updateRoleMutation.isPending}
                            className="flex-1"
                          >
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelRoleChange}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingProfile(user)}
                            className="flex-1 gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          {canEditUserRole(user) && (
                            <Button
                              size="sm"
                              onClick={() => handleRoleChange(user.id, user.role || "user")}
                              className="flex-1"
                            >
                              Edit Role
                            </Button>
                          )}
                          {isSuperAdmin() && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deleteUserMutation.isPending}
                                  className="px-3"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[5vh]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{user.full_name}</strong>'s account? 
                                    This action cannot be undone and will permanently remove all user data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Profile View Dialog */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl h-auto max-h-[95vh] sm:max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl mt-[2.5vh] sm:mt-[7.5vh] p-4 sm:p-6 [&>button]:hidden">
          <DialogHeader className="relative pb-2 sm:pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl pr-10">
              <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
              User Profile
            </DialogTitle>
            <DialogClose className="absolute right-0 top-0 h-10 w-10 p-0 rounded-full hover:bg-red-500/10 transition-colors group" aria-label="Close profile">
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 group-hover:text-red-600" />
            </DialogClose>
          </DialogHeader>
          
          {viewingProfile && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Left Column - Avatar and Social Links */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4 sm:w-1/3">
                <div className="relative">
                  <Avatar className="h-28 w-28 sm:h-40 sm:w-40 border-4 border-primary/20">
                    <AvatarImage 
                      src={viewingProfile.avatar_url || ""} 
                      alt={viewingProfile.full_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl sm:text-4xl">
                      {viewingProfile.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center">
                  <h2 className="text-lg sm:text-2xl font-bold leading-tight">{viewingProfile.full_name || "Unknown User"}</h2>
                  <Badge
                    className="mt-1.5 sm:mt-2 text-xs"
                    variant={
                      viewingProfile.role === "admin" ? "destructive" :
                      viewingProfile.role === "core" ? "default" :
                      viewingProfile.role === "co_head" ? "secondary" :
                      "outline"
                    }
                  >
                    {viewingProfile.role === "admin" ? "Admin" :
                     viewingProfile.role === "core" ? "Core Team" :
                     viewingProfile.role === "co_head" ? "Co-Head" :
                     viewingProfile.role === "student" ? "Student" :
                     viewingProfile.role === "member" ? "Member" :
                     "Unknown"}
                  </Badge>
                </div>

                {/* Social Links */}
                {(viewingProfile.github_url || viewingProfile.linkedin_url || viewingProfile.instagram_url) && (
                  <div className="flex justify-center gap-2.5 sm:gap-3 pt-2 sm:pt-3 border-t w-full">
                    {viewingProfile.github_url && (
                      <a
                        href={viewingProfile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-2.5 bg-muted/50 hover:bg-muted rounded-full transition-colors"
                        aria-label="GitHub Profile"
                      >
                        <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                    )}
                    {viewingProfile.linkedin_url && (
                      <a
                        href={viewingProfile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      </a>
                    )}
                    {viewingProfile.instagram_url && (
                      <a
                        href={viewingProfile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-2.5 bg-pink-500/10 hover:bg-pink-500/20 rounded-full transition-colors"
                        aria-label="Instagram Profile"
                      >
                        <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                      </a>
                    )}
                  </div>
                )}

                {viewingProfile.created_at && (
                  <div className="text-center text-[10px] sm:text-xs text-muted-foreground pt-2">
                    Member since {new Date(viewingProfile.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>

              {/* Right Column - Profile Details */}
              <div className="space-y-1.5 sm:space-y-2.5 sm:flex-1">
                {viewingProfile.email && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Email</p>
                      <p className="text-xs sm:text-sm font-medium truncate leading-tight">{viewingProfile.email}</p>
                    </div>
                  </div>
                )}

                {viewingProfile.phone && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Phone</p>
                      <p className="text-xs sm:text-sm font-medium leading-tight">{viewingProfile.phone}</p>
                    </div>
                  </div>
                )}

                {viewingProfile.branch && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Branch</p>
                      <p className="text-xs sm:text-sm font-medium leading-tight">{viewingProfile.branch}</p>
                    </div>
                  </div>
                )}

                {viewingProfile.year && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Year</p>
                      <p className="text-xs sm:text-sm font-medium leading-tight">Year {viewingProfile.year}</p>
                    </div>
                  </div>
                )}

                {viewingProfile.bio && (
                  <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Bio</p>
                    <p className="text-xs sm:text-sm leading-tight">{viewingProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
    </motion.div>
  );
};

export default UserManagement;