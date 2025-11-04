'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Wallet, Chrome } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp } from 'firebase/app';

interface LoginPageProps {
  onAuthSuccess: () => void;
}

// Initialize Firebase for Google OAuth only
let firebaseApp: any = null;
try {
  if (firebaseConfig.apiKey) {
    firebaseApp = initializeApp(firebaseConfig);
  }
} catch (e) {
  // Firebase already initialized or not configured
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, signup, googleSignIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter email and password',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      onAuthSuccess();
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter email and password',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password, name || undefined);
      onAuthSuccess();
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!firebaseApp) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Google sign-in is not available. Please configure Firebase.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await googleSignIn(
        user.email!,
        user.displayName,
        user.photoURL,
        user.uid
      );
      onAuthSuccess();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Sign-in Canceled',
          description: 'The sign-in popup was closed. Please try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Google sign-in failed',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Wallet className="h-8 w-8" />
            </div>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>
                  Create an account to start managing your finances.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button className="w-full" onClick={handleSignUp} disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <Chrome className="mr-2 h-4 w-4" /> Sign up with Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
