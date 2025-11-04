'use client';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Wallet, Chrome } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '.';


interface LoginPageProps {
  onAuthSuccess: () => void;
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const auth = useAuth();

  const handleAuthAction = (action: () => Promise<any>) => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'Please configure your Firebase project in src/firebase/config.ts',
      });
      return;
    }
    action()
      .then(() => {
        // onAuthSuccess is called here after any successful auth action
        onAuthSuccess();
      })
      .catch(error => {
        if (error.code === 'auth/popup-closed-by-user') {
          toast({
            variant: 'destructive',
            title: 'Sign-in Canceled',
            description: 'The sign-in popup was closed. Please try again. If you don\'t see a popup, please check if your browser is blocking them.',
          });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
      });
  };

  const handleSignUp = () => {
    handleAuthAction(() => 
      createUserWithEmailAndPassword(auth!, email, password).then(() => {
        toast({ title: 'Success', description: 'Account created successfully!' });
      })
    );
  };

  const handleLogin = () => {
    handleAuthAction(() => 
      signInWithEmailAndPassword(auth!, email, password).then(() => {
        toast({ title: 'Success', description: 'Logged in successfully!' });
      })
    );
  };
  
  const handleGoogleSignIn = () => {
    handleAuthAction(() => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth!, provider).then(() => {
        toast({ title: 'Success', description: 'Logged in successfully with Google!' });
      });
    });
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
                <Button className="w-full" onClick={handleLogin}>Login</Button>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
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
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button className="w-full" onClick={handleSignUp}>Sign Up</Button>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
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
