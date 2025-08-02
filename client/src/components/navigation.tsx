import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Users, Calendar, Car, Settings, Menu, LogOut, Languages } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import logoPath from "@assets/FFF_Logo_white_1754154030771.png";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export function Navigation({ currentView, onViewChange, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/logout', 'POST'),
    onSuccess: () => {
      queryClient.clear();
      onLogout();
      toast({
        title: t('loggedOut'),
      });
    },
  });

  const navigationItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'attendance', label: t('attendance'), icon: Calendar },
    { id: 'participants', label: t('participants'), icon: Users },
    { id: 'rides', label: t('rides'), icon: Car },
    { id: 'admin', label: t('admin'), icon: Settings },
  ];

  const handleNavigation = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigationItems.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={currentView === id ? "default" : "ghost"}
          className={`${mobile ? 'w-full justify-start' : ''} flex items-center gap-2`}
          onClick={() => handleNavigation(id)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src={logoPath} alt="FroForForno" className="h-8 w-auto" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">FroForForno</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavItems />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Languages className="h-4 w-4 mr-2" />
                {language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('it')}>
                Italiano
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="hidden md:flex"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                <NavItems mobile />
                <Button
                  variant="ghost"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}