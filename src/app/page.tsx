'use client';
import { useAuth } from '@/contexts/auth-context';
import LoginPage from '../components/auth/login-page';
import Header from '../components/layout/header';
import DashboardClient from '../components/dashboard/dashboard-client';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import LoadingDashboard from '../components/layout/loading-dashboard';

export default function Home() {
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const [isNewlyAuthenticated, setIsNewlyAuthenticated] = useState(false);

  // Show the loading dashboard for 2 seconds for a smoother transition
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isNewlyAuthenticated) {
      timer = setTimeout(() => {
        setIsNewlyAuthenticated(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isNewlyAuthenticated]);

  // Show a loader while the user state is being determined.
  if (userLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, show the login page.
  // The onAuthSuccess callback triggers the "newly authenticated" loading screen.
  if (!user) {
    return <LoginPage onAuthSuccess={() => setIsNewlyAuthenticated(true)} />;
  }

  // If the user just logged in, show the loading animation for a smooth transition.
  if (isNewlyAuthenticated) {
    return <LoadingDashboard />;
  }
  
  // If the user is logged in, show the main dashboard.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <DashboardClient />
      </main>
    </div>
  );
}
