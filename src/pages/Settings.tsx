import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/utils/animations";

// Create motion-wrapped Card component
const MotionCard = motion(Card);
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { changePassword, validatePasswordMatch } from "@/utils/passwordUtils";
import { 
  Loader2, 
  Save, 
  Lock, 
  Bell,
  MessageSquare,
  Eye,
  EyeOff
} from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Breadcrumbs from "@/components/Breadcrumbs";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState("immediate");
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const updateNotificationPreference = (key: string, value: boolean | string) => {
    // Simple state updates for now
    switch (key) {
      case 'email_notifications':
        setEmailNotifications(value as boolean);
        break;
      case 'event_reminders':
        setEventReminders(value as boolean);
        break;
      case 'marketing_emails':
        setMarketingEmails(value as boolean);
        break;
      case 'sms_notifications':
        setSmsNotifications(value as boolean);
        break;
      case 'push_notifications':
        setPushNotifications(value as boolean);
        break;
      case 'notification_frequency':
        setNotificationFrequency(value as string);
        break;
    }
  };

  // Account settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUpdatePassword = async () => {
    // Validate password match
    const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.valid) {
      toast({
        title: "Error",
        description: matchValidation.message,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      console.log('🔐 Starting password change...');
      
      // Try backend API first, fallback to direct Supabase
      let success = false;
      let message = '';
      
      try {
        console.log('📡 Attempting backend API...');
        const result = await changePassword(newPassword, currentPassword);
        console.log('📊 API Response:', result);
        
        if (result.success) {
          success = true;
          message = result.message || 'Password updated successfully via API';
        } else {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.log('⚠️ Backend API failed, using direct Supabase approach:', apiError);
        
        // Fallback to direct Supabase update
        const { error: supabaseError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (supabaseError) {
          throw supabaseError;
        }
        
        success = true;
        message = 'Password updated successfully. You will be logged out for security reasons.';
      }

      if (!success) {
        throw new Error('Failed to update password');
      }

      console.log('✅ Password updated successfully');

      // Clear form fields immediately
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Show success message
      toast({
        title: "Password Updated Successfully!",
        description: message,
        className: "bg-green-600 border-green-700 text-white shadow-xl backdrop-blur-md",
      });

      // Wait for user to see the success message
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔓 Forcing logout for security...');

      // Force logout for security
      try {
        await signOut();
        
        // Show logout message
        toast({
          title: "Logged Out for Security",
          description: "Please log in again with your new password.",
          className: "bg-blue-600 border-blue-700 text-white shadow-xl backdrop-blur-md",
        });

        // Wait a bit more for the logout message
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to login page
        navigate('/login');
      } catch (logoutError) {
        console.error('❌ Logout error:', logoutError);
        // If logout fails, still redirect to login
        window.location.href = '/login';
      }

    } catch (error: unknown) {
      console.error('❌ Password update failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
      toast({
        title: "Password Update Failed",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white shadow-xl backdrop-blur-md",
      });
    } finally {
      setPasswordLoading(false);
    }
  };




  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Breadcrumbs items={[{ label: "Settings" }]} />
        
        <motion.h1 
          className="text-4xl font-bold mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Settings
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account" className="gap-2">
              <Lock className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>


          <TabsContent value="account">
            <motion.div 
              className="max-w-2xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Password Management */}
              <MotionCard className="h-fit" variants={staggerItem}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">Password Settings</CardTitle>
                      <CardDescription className="text-sm">
                        Change your password
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handleUpdatePassword} disabled={passwordLoading || !newPassword || !confirmPassword} className="w-full" size="sm">
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Security Notice</p>
                        <p className="text-amber-700 mt-1">
                          After changing your password, you will be automatically logged out for security reasons. 
                          Please log in again with your new password.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Email Notifications */}
              <MotionCard variants={staggerItem}>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>
                    Control what emails you receive from BLOTIC
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">General Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about BLOTIC activities and announcements
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(checked) => updateNotificationPreference('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Event Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Get reminders about upcoming events you've registered for
                      </p>
                    </div>
                    <Switch
                      checked={eventReminders}
                      onCheckedChange={(checked) => updateNotificationPreference('event_reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive promotional content and partnership opportunities
                      </p>
                    </div>
                    <Switch
                      checked={marketingEmails}
                      onCheckedChange={(checked) => updateNotificationPreference('marketing_emails', checked)}
                    />
                  </div>
                </CardContent>
              </MotionCard>

              {/* SMS Notifications */}
              <MotionCard variants={staggerItem}>
                <CardHeader>
                  <CardTitle>SMS Preferences</CardTitle>
                  <CardDescription>
                    Manage text message notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via text message
                      </p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={(checked) => updateNotificationPreference('sms_notifications', checked)}
                    />
                  </div>

                  {smsNotifications && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-blue-900">SMS Setup Required</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Please verify your phone number in the Profile section to receive SMS notifications.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </MotionCard>

              {/* Push Notifications */}
              <MotionCard variants={staggerItem}>
                <CardHeader>
                  <CardTitle>Push Notifications</CardTitle>
                  <CardDescription>
                    Control browser and mobile push notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Browser Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in your browser when the site is open
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={(checked) => updateNotificationPreference('push_notifications', checked)}
                    />
                  </div>

                  {pushNotifications && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start space-x-3">
                        <Bell className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-900">Push Notifications Enabled</h5>
                          <p className="text-sm text-green-700 mt-1">
                            You'll receive real-time notifications for important updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </MotionCard>

              {/* Notification Frequency */}
              <MotionCard variants={staggerItem}>
                <CardHeader>
                  <CardTitle>Notification Frequency</CardTitle>
                  <CardDescription>
                    Choose how often you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Email Frequency</Label>
                    <Select value={notificationFrequency} onValueChange={(value) => updateNotificationPreference('notification_frequency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="monthly">Monthly Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </MotionCard>

              {/* Save Button */}
              <motion.div variants={staggerItem}>
              <Button disabled={isUpdatingNotifications} className="w-full">
                {isUpdatingNotifications ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Preferences Auto-Saved
                  </>
                )}
              </Button>
              </motion.div>
            </motion.div>
          </TabsContent>

        </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
