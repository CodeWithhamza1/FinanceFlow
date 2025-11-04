'use client';

import { Wallet, Loader2 } from 'lucide-react';

export default function LoadingDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-pulse">
            <Wallet className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );
}
