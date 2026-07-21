import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  LogIn,
  UserPlus,
  Home,
  Calendar,
  Users,
  Shield,
  Camera,
  QrCode,
  BookOpen,
  LayoutDashboard,
  Images
} from "@/components/icons";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { detectUserRole } from "@/utils/productionFixes";
import { useToast } from "@/hooks/use-toast";
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

interface NavTabProps {
  children: React.ReactNode;
  setPosition: (position: { left: number; width: number; opacity: number }) => void;
  to: string;
  isActive: boolean;
}

const NavTab = ({ children, setPosition, to, isActive }: NavTabProps) => {
  const ref = useRef<HTMLLIElement>(null);

  const handleClick = () => {
    // Navigation will naturally load page from top
  };

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
      <Link
        to={to}
        onClick={handleClick}
        className={`block cursor-pointer px-6 py-2 text-lg font-medium whitespace-nowrap transition-colors duration-200 ${
          isActive 
            ? 'text-white' 
            : 'text-white/70 hover:text-white'
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const { user, userProfile, signOut } = useAuth();
  const { isSuperAdmin, isCore, hasRole } = useRoleCheck();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { path: "/about", label: "About", icon: <User className="w-4 h-4" /> },
    { path: "/core", label: "Core Team", icon: <Users className="w-4 h-4" /> },
    { path: "/events", label: "Events", icon: <Calendar className="w-4 h-4" /> },
    { path: "/blogs", label: "Blogs", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/gallery", label: "Gallery", icon: <Camera className="w-4 h-4" /> },
  ];

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
    const detected = detectUserRole(userProfile, user?.email || undefined);
    switch (detected) {
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
      // Sign out first
      await signOut();
      
      // Then redirect to home after successful logout
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      setIsLoggingOut(false); // Only reset loading state on error
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100]">
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
                className="hidden lg:flex items-center relative"
              >
                {navLinks.map((link) => (
                  <NavTab key={link.path} setPosition={setPosition} to={link.path} isActive={isActive(link.path)}>
                    {link.label}
                  </NavTab>
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
              {user ? (
              <>
                {/* Desktop Profile Dropdown */}
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full cursor-pointer">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20">
                          <AvatarImage 
                            src={userProfile?.avatar_url} 
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
                            {user.email}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {getRoleDisplay()}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(isSuperAdmin() || isCore()) && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="cursor-pointer text-blue-400 hover:text-blue-300">
                              <Shield className="mr-2 h-4 w-4 text-blue-400" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      {(hasRole('admin') || hasRole('core') || hasRole('co_head') || hasRole('member')) && (
                        <DropdownMenuItem asChild>
                          <Link to="/attendance" className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                            <QrCode className="mr-2 h-4 w-4 text-cyan-400" />
                            <span>Attendance</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isLoggingOut) {
                            handleLogoutClick();
                          }
                        }} 
                        className={`cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <div className="mr-2 h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4 text-red-400" />
                        )}
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
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
                        src={userProfile?.avatar_url} 
                        alt={getDisplayName()}
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </div>
              </>
            ) : (
              // Desktop Login/Register Buttons - Hidden on Mobile/Tablet
              <div className="hidden lg:flex items-center gap-3">
                <Link to="/register">
                  <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all duration-300 ease-out rounded-full px-6 py-3 h-10"
                  >
                    Register
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-2 border-purple-500/60 text-purple-200 hover:bg-purple-500/10 hover:text-white hover:border-purple-400 hover:scale-105 active:scale-95 transition-all duration-300 ease-out rounded-full px-6 py-3 h-10 bg-transparent"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
              </div>
            )}

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
        <div className="lg:hidden mt-4 mx-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-background/90 backdrop-blur-lg border border-purple-500/40 rounded-2xl shadow-2xl p-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => {
                setIsOpen(false);
                // Mobile navigation will naturally load page from top
              }}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'text-white/70 hover:text-white hover:bg-purple-500/10'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              </Link>
            ))}
            
            {!user && (
              <div className="space-y-2">
                {/* Separator line before account section */}
                <div className="border-t border-purple-500/20 my-2"></div>
                
                <Link to="/register" onClick={() => {
                  setIsOpen(false);
                }}>
                  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/register')
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'text-white/70 hover:text-white hover:bg-purple-500/10'
                  }`}>
                    <UserPlus className="w-4 h-4" />
                    Register
                  </button>
                </Link>
                <Link to="/login" onClick={() => {
                  setIsOpen(false);
                }}>
                  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/login')
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'text-white/70 hover:text-white hover:bg-purple-500/10'
                  }`}>
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Profile Menu */}
      {isProfileMenuOpen && user && (
        <div className="lg:hidden mt-4 mx-4">
          <div className="bg-gradient-to-br from-purple-900/40 to-background/90 backdrop-blur-lg border border-purple-500/40 rounded-2xl shadow-2xl p-4 space-y-2">
            {/* User Info Header */}
            <div className="px-3 py-3 text-sm text-muted-foreground border-b border-purple-500/20">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-purple-500/30">
                  <AvatarImage 
                    src={userProfile?.avatar_url} 
                    alt={getDisplayName()}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-sm font-semibold">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-base">{getDisplayName()}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  <div className="text-xs text-purple-400 font-medium">{getRoleDisplay()}</div>
                </div>
              </div>
            </div>

            {/* Admin Dashboard */}
            {(isSuperAdmin() || isCore()) && (
              <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors">
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </button>
              </Link>
            )}

            {/* Dashboard */}
            <Link to="/dashboard" onClick={() => setIsProfileMenuOpen(false)}>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-purple-500/10 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            </Link>

            {/* Attendance */}
            {(hasRole('admin') || hasRole('core') || hasRole('co_head') || hasRole('member')) && (
              <Link to="/attendance" onClick={() => setIsProfileMenuOpen(false)}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors">
                  <QrCode className="w-4 h-4" />
                  Attendance
                </button>
              </Link>
            )}

            {/* Profile */}
            <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)}>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-purple-500/10 transition-colors">
                <User className="w-4 h-4" />
                Profile
              </button>
            </Link>

            {/* Settings */}
            <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)}>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-purple-500/10 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </Link>

            {/* Logout */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isLoggingOut) {
                  handleLogoutClick();
                  setIsProfileMenuOpen(false);
                }
              }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isLoggingOut ? 'Logging out...' : 'Logout'}
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

export default Navigation;
