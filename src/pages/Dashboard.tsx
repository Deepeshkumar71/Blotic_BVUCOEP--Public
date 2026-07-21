import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";
import { 
  Star,
  Target,
  Rocket,
  ArrowRight,
  Sparkles,
  Zap,
  User,
  Calendar,
  Users,
  BookOpen,
  Shield,
  Settings,
  Heart
} from "@/components/icons";

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { isSuperAdmin, isCore, isStudent } = useRoleCheck();

  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Student';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Hero Welcome Section */}
      <div className="relative pt-16 pb-6 px-3 sm:pt-20 sm:pb-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative container mx-auto max-w-6xl">
          <motion.div 
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={fadeInUp.transition}
            className="text-center mb-6 sm:mb-8 lg:mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 leading-tight">
              Welcome,{" "}
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {getDisplayName()}!
              </span>
            </h1>
            
            <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
              {getRoleDisplay()} • Ready to explore the blockchain revolution?
            </p>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'today'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                <span>Profile {userProfile?.full_name ? 'Complete' : 'Incomplete'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6 sm:mb-8"
          >
            {/* Profile Quick Action */}
            <motion.div variants={staggerItem}>
              <Link to="/profile" className="group block h-full">
              <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-600/20 group-hover:bg-purple-600/30 transition-colors">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Profile</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage your personal information</p>
                </CardContent>
              </Card>
              </Link>
            </motion.div>

            {/* Events Quick Action */}
            <motion.div variants={staggerItem}>
              <Link to="/events" className="group block h-full">
              <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-full bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Events</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Discover upcoming BLOTIC events</p>
                </CardContent>
              </Card>
              </Link>
            </motion.div>

            {/* Core Team Quick Action */}
            <motion.div variants={staggerItem}>
              <Link to="/core" className="group block h-full">
              <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 border-green-500/20 bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-full bg-green-600/20 group-hover:bg-green-600/30 transition-colors">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Core Team</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Meet our amazing team</p>
                </CardContent>
              </Card>
              </Link>
            </motion.div>

            {/* Write Blog Quick Action - Only for Members/Co-heads */}
            <motion.div variants={staggerItem} style={{ display: userProfile?.role && ['member', 'co_head'].includes(userProfile.role) ? 'block' : 'none' }}>
              <Link to="/write-blog" className="group block h-full">
              <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 border-pink-500/20 bg-gradient-to-br from-pink-900/20 to-pink-800/10 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-full bg-pink-600/20 group-hover:bg-pink-600/30 transition-colors">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-pink-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Write Blog</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Share your knowledge</p>
                </CardContent>
              </Card>
              </Link>
            </motion.div>

            {/* Dashboard Quick Action - Only for Admin/Core */}
            {(isSuperAdmin() || isCore()) && (
              <motion.div variants={staggerItem}>
                <Link to="/admin" className="group block h-full">
                <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border-red-500/20 bg-gradient-to-br from-red-900/20 to-red-800/10 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-full bg-red-600/20 group-hover:bg-red-600/30 transition-colors">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Admin Dashboard</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Access administrative features</p>
                  </CardContent>
                </Card>
                </Link>
              </motion.div>
            )}


            {/* Settings Quick Action */}
            <motion.div variants={staggerItem}>
              <Link to="/settings" className="group block h-full">
              <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-orange-800/10 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-full bg-orange-600/20 group-hover:bg-orange-600/30 transition-colors">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Settings</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Customize your experience</p>
                </CardContent>
              </Card>
              </Link>
            </motion.div>
          </motion.div>

          {/* Account Details Card */}
          <Card className="border-gray-500/30 bg-gradient-to-br from-gray-900/30 to-gray-800/20 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                <div className="p-1.5 sm:p-2 rounded-full bg-gray-600/20">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 sm:p-4 rounded-lg bg-gray-900/20 border border-gray-500/20">
                  <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Email</p>
                  <p className="text-xs sm:text-sm truncate">{user?.email}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-gray-900/20 border border-gray-500/20">
                  <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Role</p>
                  <p className="text-xs sm:text-sm">{getRoleDisplay()}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-gray-900/20 border border-gray-500/20">
                  <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Joined</p>
                  <p className="text-xs sm:text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-gray-900/20 border border-gray-500/20">
                  <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-xs sm:text-sm">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
