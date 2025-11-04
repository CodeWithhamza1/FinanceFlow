'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import api, { setAuthToken } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  googleSignIn: (email: string, displayName: string | null, photoURL: string | null, providerId: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthToken(token);
      const response = await api.get('/api/user');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('auth_token');
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      setAuthToken(token);
      setUser(userData);
      toast({ title: 'Success', description: 'Logged in successfully!' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const response = await api.post('/api/auth/signup', { email, password, displayName });
      const { token, user: userData } = response.data;
      setAuthToken(token);
      setUser(userData);
      toast({ title: 'Success', description: 'Account created successfully!' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Signup failed';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    }
  };

  const googleSignIn = async (email: string, displayName: string | null, photoURL: string | null, providerId: string) => {
    try {
      const response = await api.post('/api/auth/google', {
        email,
        displayName,
        photoURL,
        providerId,
      });
      const { token, user: userData } = response.data;
      setAuthToken(token);
      setUser(userData);
      toast({ title: 'Success', description: 'Logged in successfully with Google!' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Google sign-in failed';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    }
  };

  const logout = async () => {
    // Log logout before clearing user
    if (user) {
      try {
        await api.post('/api/logs', {
          action: 'LOGOUT',
          description: `User logged out: ${user.email}`,
        });
      } catch (e) {
        // Silently fail - logging should not break logout
        console.error('Failed to log logout:', e);
      }
    }
    
    setAuthToken(null);
    setUser(null);
    toast({ title: 'Success', description: 'Logged out successfully!' });
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.put('/api/user', userData);
      // Ensure we update user state with the complete user object from response
      if (response.data) {
        setUser(response.data);
      }
      
      // If currency changed, fetch rate and trigger conversion of all values
      if (userData.currency && user?.currency !== userData.currency) {
        const { clearCurrencyCache } = await import('@/lib/currency-utils');
        clearCurrencyCache();
        
        // Fetch rate for new currency (this will cache it)
        try {
          const response = await api.get(`/api/currency/convert?from=USD&to=${userData.currency}&amount=1&refresh=true`);
          
          // Store the rate in cache immediately
          if (response.data.rate && typeof window !== 'undefined') {
            const { setCachedRatesToStorage } = await import('@/lib/currency-utils');
            setCachedRatesToStorage({ [userData.currency]: response.data.rate }, userData.currency);
          }
          
          // Trigger a window event to notify all components to refresh conversions
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('currencyChanged', { 
              detail: { newCurrency: userData.currency, oldCurrency: user?.currency } 
            }));
          }
        } catch (e) {
          console.error('Failed to fetch currency rate:', e);
        }
      }
      
      // Only show toast if this wasn't called from avatar upload (to avoid duplicate toasts)
      if (!userData.photoURL) {
        toast({ title: 'Success', description: 'Profile updated successfully!' });
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Update failed';
      toast({ variant: 'destructive', title: 'Error', description: message });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        googleSignIn,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

