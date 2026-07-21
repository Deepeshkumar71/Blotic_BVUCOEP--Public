import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Globe, UserCog, Calendar, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { getAdminSettings, getAdminSettingsAsync, saveAdminSettings, resetAdminSettings, initializeSettings, type AdminSettings as SettingsData } from "@/utils/adminSettingsManager";

interface SettingsDataLegacy {
  // General
  siteTitle: string;
  siteEmail: string;
  siteDescription: string;
  contactPhone: string;
  
  // Registration
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  
  // Events
  allowEventRegistration: boolean;
  
  // Security
  sessionTimeoutMinutes: number;
  minPasswordLength: number;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>(getAdminSettings());
  const [loading, setLoading] = useState(false);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      await initializeSettings();
      const loadedSettings = await getAdminSettingsAsync();
      setSettings(loadedSettings);
      console.log('📋 Admin settings loaded from database:', loadedSettings);
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    // Validate session timeout
    if (settings.sessionTimeoutMinutes < 5) {
      toast({
        title: "Invalid Session Timeout",
        description: "Session timeout must be at least 5 minutes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting save operation...');
      const success = await saveAdminSettings(settings);
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your settings have been saved to the database and will apply on all devices immediately.",
          variant: "default",
        });
      } else {
        console.error('❌ Save failed - check console for details');
        toast({
          title: "Save Failed",
          description: "Failed to save settings. Please check your permissions and try again. Check browser console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Exception during save:', error);
      toast({
        title: "Error",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const success = await resetAdminSettings();
      
      if (success) {
        const defaultSettings = await getAdminSettingsAsync();
        setSettings(defaultSettings);
        
        toast({
          title: "Settings Reset",
          description: "Settings have been reset to defaults in the database.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while resetting settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Configure platform-wide settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 lg:mx-0 px-1 lg:px-0">
          <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-4 gap-2 p-1 bg-muted/50 rounded-lg border border-white/20">
            <TabsTrigger 
              value="general" 
              className="flex items-center justify-center py-3 px-4 min-w-[140px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">General</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="registration" 
              className="flex items-center justify-center py-3 px-4 min-w-[140px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Registration</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center justify-center py-3 px-4 min-w-[140px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Events</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center justify-center py-3 px-4 min-w-[140px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Security</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic site information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  placeholder="BLOTIC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteEmail">Contact Email</Label>
                <Input
                  id="siteEmail"
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                  placeholder="bloticbvducoep@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  placeholder="Bharati Vidyapeeth's Premier Blockchain & Web3 Club"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Settings */}
        <TabsContent value="registration" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                Registration Settings
              </CardTitle>
              <CardDescription>
                Configure user registration and approval settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="registrationEnabled" className="text-base font-medium">Enable Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register on the platform
                  </p>
                </div>
                <Switch
                  id="registrationEnabled"
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, registrationEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailVerificationRequired">Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  id="emailVerificationRequired"
                  checked={settings.emailVerificationRequired}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailVerificationRequired: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Settings */}
        <TabsContent value="events" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Settings
              </CardTitle>
              <CardDescription>
                Configure global event registration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="allowEventRegistration" className="text-base font-medium">Allow Event Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable event registration for members
                  </p>
                </div>
                <Switch
                  id="allowEventRegistration"
                  checked={settings.allowEventRegistration}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowEventRegistration: checked })
                  }
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 0 })
                  }
                  placeholder="60"
                  min="1"
                />
                {settings.sessionTimeoutMinutes < 5 && (
                  <p className="text-xs text-red-500">
                    ⚠️ Minimum session timeout is 5 minutes
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Automatically logout users after inactivity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  value={settings.minPasswordLength}
                  onChange={(e) =>
                    setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) || 8 })
                  }
                  placeholder="8"
                  min="6"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum characters required for passwords
                </p>
              </div>

              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-700 dark:text-yellow-500 mb-1">
                        Security Notice
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        These settings affect platform security. Changes should be made carefully
                        and tested thoroughly before deployment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg mt-8 -mx-6 px-6 py-4 pb-safe mb-16 sm:mb-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Make sure to save your changes before leaving this page
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {loading ? "Resetting..." : "Reset to Defaults"}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 order-1 sm:order-2"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
