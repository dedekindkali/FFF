import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import logoPath from "@assets/FFF_Logo_white_1754154030771.png";

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function Login({ onLogin, onSignUp }: LoginProps) {
  const [username, setUsername] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const loginMutation = useMutation({
    mutationFn: (username: string) => apiRequest('/api/auth/login', 'POST', { username }),
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
          title: "Login failed",
          description: "Please check your username and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (username: string) => apiRequest('/api/auth/signup', 'POST', { username }),
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
          title: "Sign-up failed",
          description: "Please try again.",
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
    if (signUpUsername.trim()) {
      signUpMutation.mutate(signUpUsername.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src={logoPath} alt="FroForForno Logo" className="mx-auto h-16 w-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">FroForForno</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('eventDates')}</p>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('welcomeBack')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('signInDesc')}</p>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('createAccount')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('signUpDesc')}</p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('chooseUsername')}
                    </label>
                    <Input
                      id="signup-username"
                      name="signup-username"
                      type="text"
                      required
                      className="mt-1"
                      placeholder={t('enterNewUsername')}
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}