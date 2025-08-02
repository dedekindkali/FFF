import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Home, Calendar, Users, Settings, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export function Navigation({ currentView, onViewChange, onLogout }: NavigationProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const user = (userData as any)?.user;

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
      });
      onLogout();
    },
    onError: () => {
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    },
  });

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'participants', label: 'Participants', icon: Users },
    ...(user?.isAdmin ? [{ key: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src="/attached_assets/FFF_Logo-01.png" alt="Event Logo" className="h-8 w-8 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Event Manager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-8">
              {navItems.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant="ghost"
                  className={`${
                    currentView === key
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 rounded-none'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  onClick={() => onViewChange(key)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Button>
              ))}
            </nav>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.username}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
