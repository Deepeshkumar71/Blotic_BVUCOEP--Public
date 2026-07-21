import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, ArrowLeft, Shield, Calendar, Users, Image, UsersRound, Settings, Menu, X, QrCode, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavHero from "./NavHero";
import LogoutConfirmationDialog from "@/components/ui/logout-confirmation-dialog";

interface AdminNavTabProps {
  children: React.ReactNode;
  setPosition: (position: { left: number; width: number; opacity: number }) => void;
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
}

const AdminNavTab = ({ children, setPosition, onClick, isActive, icon }: AdminNavTabProps) => {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;

        const { width } = ref.current.getBoundingClientRect();

        setPosition({
          left: ref.current.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      className="relative z-10"
    >
      <button
        onClick={onClick}
        className={`flex items-center gap-2 cursor-pointer px-6 py-2 text-lg font-medium whitespace-nowrap transition-colors duration-200 ${
          isActive 
            ? 'text-white' 
            : 'text-white/70 hover:text-white'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{children}</span>
      </button>
    </li>
  );
};

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavigation = ({ activeTab, onTabChange }: AdminNavigationProps) => {
  const { user, userProfile, signOut } = useAuth();
  const { isSuperAdmin, isCore, hasRole } = useRoleCheck();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const isAdmin = hasRole("admin");
  const isCoreUser = hasRole("core");

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: <Shield className="w-4 h-4" />, show: true },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" />, show: (isAdmin || isCoreUser) },
    { id: "events", label: "Events", icon: <Calendar className="w-4 h-4" />, show: true },
    { id: "blogs", label: "Blogs", icon: <BookOpen className="w-4 h-4" />, show: (isAdmin || isCoreUser) },
    { id: "photos", label: "Photos", icon: <Image className="w-4 h-4" />, show: true },
    { id: "core-team", label: "Core Team", icon: <UsersRound className="w-4 h-4" />, show: isAdmin },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, show: isAdmin },
  ];

  const visibleTabs = adminTabs.filter(tab => tab.show);

  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = () => {
    if (!userProfile?.role) return 'Member';
    
    switch (userProfile.role) {
      case 'admin':
        return 'Admin';
      case 'core':
        return 'Core Team';
      case 'co_head':
        return 'Co-Head';
      case 'member':
        return 'Member';
      case 'student':
        return 'Student';
      default:
        return 'Member';
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    setIsLoggingOut(true);
    
    try {
      await signOut();
      
      // Redirect to home after successful logout
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const goToMainSite = () => {
    window.opener?.focus();
    window.close();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Full width curved container */}
      <div className="w-full pt-4 px-3 sm:px-6">
        <div className="bg-gradient-to-r from-purple-900/40 via-background/90 to-purple-900/40 backdrop-blur-lg border-2 border-purple-500/40 rounded-full shadow-2xl px-2 sm:px-8 py-2 w-full ring-1 ring-purple-300/30">
          <div className="flex items-center justify-between h-16 w-full max-w-full overflow-hidden">
            {/* Left Side - Logo */}
            <div className="flex-shrink-0 mr-2 sm:mr-16 ml-2 sm:ml-4">
              <Link to="/" className="block">
                <NavHero />
              </Link>
            </div>

            {/* Center - Desktop Navigation (Absolutely Centered) */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <ul
                onMouseLeave={() => {
                  setPosition((pv) => ({
                    ...pv,
                    opacity: 0,
                  }));
                }}
                className="hidden md:flex items-center relative"
              >
                {visibleTabs.map((tab) => (
                  <AdminNavTab 
                    key={tab.id} 
                    setPosition={setPosition} 
                    onClick={() => onTabChange(tab.id)} 
                    isActive={activeTab === tab.id}
                    icon={tab.icon}
                  >
                    {tab.label}
                  </AdminNavTab>
                ))}
                
                {/* Animated cursor */}
                <motion.li
                  animate={{
                    ...position,
                  }}
                  className="absolute z-0 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg"
                />
              </ul>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 ml-2 sm:ml-16">
              {/* Desktop Profile Dropdown */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full cursor-pointer">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20">
                        <AvatarImage 
                          src={userProfile?.avatar_url || undefined} 
                          alt={getDisplayName()}
                          className="object-cover w-full h-full"
                        />
                        <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-56 relative bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl rounded-xl animate-in slide-in-from-top-2 duration-200" 
                    align="end" 
                    forceMount
                    sideOffset={8}
                  >
                    {/* Notch pointing to profile picture */}
                    <div className="absolute -top-2 right-6 w-4 h-4 bg-background/95 border-l border-t border-border/50 rotate-45 backdrop-blur-lg"></div>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {getRoleDisplay()}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => window.location.href = '/'} className="cursor-pointer text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                      <ArrowLeft className="mr-2 h-4 w-4 text-blue-400" />
                      <span>Back to Main Site</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => window.location.href = '/settings'} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleLogoutClick} 
                      className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="mr-2 h-4 w-4 text-red-400" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Profile Button */}
              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    setIsOpen(false); // Close main menu when opening profile menu
                  }}
                  className="relative h-12 w-12 rounded-full flex items-center justify-center"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage 
                      src={userProfile?.avatar_url || undefined} 
                      alt={getDisplayName()}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden mr-2 flex-shrink-0 h-12 w-12 flex items-center justify-center hover:bg-red-500/10"
                onClick={() => {
                  setIsOpen(!isOpen);
                  setIsProfileMenuOpen(false); // Close profile menu when opening main menu
                }}
              >
                {isOpen ? <X className="h-6 w-6 text-red-500" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden mt-4 mx-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-background/90 backdrop-blur-lg border border-purple-500/40 rounded-2xl shadow-2xl p-4 space-y-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                    : 'text-white/70 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Profile Menu */}
      {isProfileMenuOpen && (
        <div className="lg:hidden mt-4 mx-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-background/90 backdrop-blur-lg border border-purple-500/40 rounded-2xl shadow-2xl p-4 space-y-2">
            {/* User Info Header */}
            <div className="px-3 py-3 text-sm text-muted-foreground border-b border-purple-500/20">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-purple-500/30">
                  <AvatarImage 
                    src={userProfile?.avatar_url || undefined} 
                    alt={getDisplayName()}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-sm font-semibold">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-base">{getDisplayName()}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  <div className="text-xs text-purple-400 font-medium">{getRoleDisplay()}</div>
                </div>
              </div>
            </div>

            {/* Back to Main Site */}
            <button
              onClick={() => {
                window.location.href = '/';
                setIsProfileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main Site
            </button>

            {/* View Profile */}
            <button
              onClick={() => {
                window.location.href = '/profile';
                setIsProfileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-purple-500/10 transition-colors"
            >
              <User className="w-4 h-4" />
              View Profile
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                window.location.href = '/settings';
                setIsProfileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-purple-500/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            {/* Sign Out */}
            <button
              onClick={() => {
                handleLogoutClick();
                setIsProfileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={getDisplayName()}
      />
    </nav>
  );
};

export default AdminNavigation;
