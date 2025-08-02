import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Navigation } from "@/components/navigation";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { Attendance } from "@/pages/attendance";
import { Participants } from "@/pages/participants";
import { Rides } from "@/pages/rides";
import { Admin } from "@/pages/admin";
import { Profile } from "@/pages/profile";
import { useQuery } from "@tanstack/react-query";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  useEffect(() => {
    const user = (userData as any)?.user;
    if (user) {
      setIsAuthenticated(true);
    } else if (error || (!isLoading && !userData)) {
      setIsAuthenticated(false);
    }
  }, [userData, error, isLoading]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setIsAdminMode(false);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  const handleAdminLogin = () => {
    setIsAdminMode(true);
    setIsAuthenticated(false); // Admin doesn't need regular auth
  };

  const handleSignUp = () => {
    setIsAuthenticated(true);
    setIsAdminMode(false);
    setCurrentView('attendance'); // Redirect to attendance after signup
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminMode(false);
    setCurrentView('dashboard');
    queryClient.clear();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAdminMode) {
    return <Admin onLogout={handleLogout} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} onAdminLogin={handleAdminLogin} />;
  }

  const renderCurrentView = () => {
    if (currentView.startsWith('profile/')) {
      const userId = currentView.split('/')[1];
      return <Profile onNavigate={setCurrentView} userId={userId} />;
    }
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'attendance':
        return <Attendance onNavigate={setCurrentView} />;
      case 'participants':
        return <Participants onNavigate={setCurrentView} />;
      case 'rides':
        return <Rides />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      {renderCurrentView()}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="froforforno-theme">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
