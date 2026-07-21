/**
 * User Verification Status Component for Admin Panel
 * 
 * Shows verification status of all users and allows admins to see security issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertCircle, CheckCircle, Mail, RefreshCw } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

interface UserVerificationData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED';
}

const UserVerificationStatus = () => {
  const [users, setUsers] = useState<UserVerificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchUserVerificationData = async () => {
    try {
      // Get users with their verification status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth data for each user
      const userVerificationData: UserVerificationData[] = [];
      
      for (const profile of profiles || []) {
        try {
          // This requires admin privileges to access auth.users
          const { data: authData, error: authError } = await supabase
            .rpc('get_user_auth_data', { user_id: profile.id });

          if (!authError && authData) {
            userVerificationData.push({
              ...profile,
              email: authData.email,
              email_confirmed_at: authData.email_confirmed_at,
              last_sign_in_at: authData.last_sign_in_at,
              verification_status: authData.email_confirmed_at ? 'VERIFIED' : 'UNVERIFIED'
            });
          }
        } catch (error) {
          // If we can't get auth data, still show the profile
          userVerificationData.push({
            ...profile,
            email: 'Unknown',
            email_confirmed_at: null,
            last_sign_in_at: null,
            verification_status: 'UNVERIFIED'
          });
        }
      }

      setUsers(userVerificationData);
    } catch (error) {
      console.error('Error fetching user verification data:', error);
      toast({
        title: "Error",
        description: "Failed to load user verification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserVerificationData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserVerificationData();
  };

  const unverifiedUsers = users.filter(user => user.verification_status === 'UNVERIFIED');
  const verifiedUsers = users.filter(user => user.verification_status === 'VERIFIED');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2">Loading verification data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alert for Unverified Users */}
      {unverifiedUsers.length > 0 && (
        <Alert className="border-red-500/20 bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <strong>Security Alert:</strong> {unverifiedUsers.length} user(s) have unverified email addresses. 
            They should not have access to the system until verified.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verified Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{verifiedUsers.length}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Unverified Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{unverifiedUsers.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Verification Status</CardTitle>
              <CardDescription>
                Monitor email verification status of all users
              </CardDescription>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{user.full_name || 'Unknown Name'}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge 
                      variant={user.verification_status === 'VERIFIED' ? 'default' : 'destructive'}
                      className={user.verification_status === 'VERIFIED' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                      }
                    >
                      {user.verification_status === 'VERIFIED' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                  {user.last_sign_in_at && (
                    <div>Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}</div>
                  )}
                  {user.email_confirmed_at && (
                    <div>Verified: {new Date(user.email_confirmed_at).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserVerificationStatus;
