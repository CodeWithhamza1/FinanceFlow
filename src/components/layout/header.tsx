'use client';
import { Wallet, LogOut, User as UserIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevPhotoURL, setPrevPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    // Trigger animation when photo URL changes
    if (user?.photoURL && user.photoURL !== prevPhotoURL && prevPhotoURL !== null) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    // Update prevPhotoURL on mount or when user.photoURL changes
    if (user?.photoURL !== prevPhotoURL) {
      setPrevPhotoURL(user?.photoURL || null);
    }
  }, [user?.photoURL]);

  const handleSignOut = () => {
    logout();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="font-bold text-xl tracking-tight">FinanceFlow</span>
      </Link>
      <div className="ml-auto">
        {user && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className={`transition-all duration-300 ${isAnimating ? 'ring-4 ring-primary/50 scale-110' : 'ring-0 scale-100'}`}>
                  {user.photoURL && (
                    <AvatarImage 
                      key={user.photoURL} 
                      src={user.photoURL} 
                      alt={user.displayName || ''}
                      className={`transition-all duration-300 object-cover ${isAnimating ? 'brightness-110' : 'brightness-100'}`}
                    />
                  )}
                  <AvatarFallback className="transition-all duration-300">{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName || user.email || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings" passHref>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
