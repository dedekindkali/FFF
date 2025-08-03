import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import logoPath from "@assets/FFF_Logo_white_1754154030771.png";

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
  onAdminLogin: () => void;
}

export function Login({ onLogin, onSignUp, onAdminLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [signUpData, setSignUpData] = useState({
    username: "",
    phone: ""
  });
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const loginMutation = useMutation({
    mutationFn: (username: string) => apiRequest('POST', '/api/auth/login', { username }),
    onSuccess: () => {
      toast({
        title: t('welcomeBack'),
      });
      onLogin();
    },
    onError: (error: any) => {
      if (error?.message?.includes('not found')) {
        toast({
          title: t('userNotFound'),
          description: t('userNotFoundDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('loginFailed'),
          description: t('checkUsername'),
          variant: "destructive",
        });
      }
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (userData: any) => apiRequest('POST', '/api/auth/signup', userData),
    onSuccess: () => {
      toast({
        title: t('accountCreated'),
        description: t('redirectingToAttendance'),
      });
      onSignUp();
    },
    onError: (error: any) => {
      if (error?.message?.includes('already exists')) {
        toast({
          title: t('usernameExists'),
          description: t('usernameExistsDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('signupFailed'),
          description: t('tryAgain'),
          variant: "destructive",
        });
      }
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (password: string) => {
      // Direct admin authentication - no user login required
      await apiRequest('POST', '/api/admin/auth', { password });
      return true;
    },
    onSuccess: () => {
      toast({
        title: t('adminAccessGranted'),
        description: t('redirectingToAdmin'),
      });
      onAdminLogin();
    },
    onError: (error: any) => {
      if (error?.message?.includes('Invalid admin password')) {
        toast({
          title: t('invalidAdminPassword'),
          description: t('checkAdminPassword'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('adminLoginFailed'),
          description: t('tryAgain'),
          variant: "destructive",
        });
      }
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      loginMutation.mutate(username.trim());
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.username.trim()) {
      const userData = {
        username: signUpData.username.trim(),
        phone: signUpData.phone.trim() || null
      };
      signUpMutation.mutate(userData);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim()) {
      adminLoginMutation.mutate(adminPassword.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src={logoPath} alt="FroForForno Logo" className="mx-auto h-16 w-auto mb-4" />
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300 font-medium leading-tight">
            un'unica festa<br />
            una festa unica
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('eventDates')}</p>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl subtitle-font text-gray-900 dark:text-white">{t('welcomeBack')}</h3>
                  <p className="text-sm body-text text-gray-600 dark:text-gray-400 mt-1">{t('signInDesc')}</p>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm subtitle-font text-gray-700 dark:text-gray-300">
                      {t('username')}
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="mt-1"
                      placeholder={t('enterUsername')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {loginMutation.isPending ? t('signingIn') : t('signIn')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl subtitle-font text-gray-900 dark:text-white">{t('createAccount')}</h3>
                  <p className="text-sm body-text text-gray-600 dark:text-gray-400 mt-1">{t('signUpDesc')}</p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-username">{t('chooseUsername')}</Label>
                    <Input
                      id="signup-username"
                      name="signup-username"
                      type="text"
                      required
                      className="mt-1"
                      placeholder={t('enterNewUsername')}
                      value={signUpData.username}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>



                  <div>
                    <Label htmlFor="signup-phone">{t('phone')} {t('contactOptional')}</Label>
                    <Input
                      id="signup-phone"
                      name="signup-phone"
                      type="tel"
                      className="mt-1"
                      placeholder={t('enterPhone')}
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signUpMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {signUpMutation.isPending ? t('creatingAccount') : t('createAccount')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Login</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Access the admin panel</p>
                </div>
                
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <Input
                      id="admin-password"
                      name="admin-password"
                      type="password"
                      required
                      className="mt-1"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={adminLoginMutation.isPending}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {adminLoginMutation.isPending ? "Logging in..." : "Admin Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}