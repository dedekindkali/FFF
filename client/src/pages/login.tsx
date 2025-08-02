import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import logoPath from "@assets/FFF_Logo_white_1754154030771.png";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const loginMutation = useMutation({
    mutationFn: (username: string) => apiRequest('POST', '/api/auth/login', { username }),
    onSuccess: () => {
      toast({
        title: "Welcome to the Event Management System!",
      });
      onLogin();
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Please check your username and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      loginMutation.mutate(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src={logoPath} alt="FroForForno Logo" className="mx-auto h-16 w-16 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('loginTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('loginSubtitle')}</p>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <LogIn className="mr-2 h-4 w-4" />
                {loginMutation.isPending ? t('loading') : t('login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
