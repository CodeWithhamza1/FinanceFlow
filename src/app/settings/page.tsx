'use client';

import Header from '../../components/layout/header';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Camera, X, FileText } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import api from '../../lib/api';
import ManageCategoriesCard from '../../components/settings/manage-categories-card';
import { useCategories } from '../../hooks/use-categories';
import IncomeManagementCard from '../../components/settings/income-management-card';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar (USD)' },
  { code: 'EUR', name: 'Euro (EUR)' },
  { code: 'GBP', name: 'British Pound (GBP)' },
  { code: 'JPY', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', name: 'Australian Dollar (AUD)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'CNY', name: 'Chinese Yuan (CNY)' },
  { code: 'INR', name: 'Indian Rupee (INR)' },
  { code: 'PKR', name: 'Pakistani Rupee (PKR)' },
];

export default function SettingsPage() {
  const { user, loading: userLoading, updateUser } = useAuth();
  const { toast } = useToast();
  const { data: categories, loading: categoriesLoading } = useCategories();
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setCurrency(user.currency || 'USD');
      setPreviewImage(null); // Reset preview when user changes
      
      // Log settings page view
      api.post('/api/logs', {
        action: 'SETTINGS_VIEW',
        description: 'Viewed settings page',
      }).catch(() => {}); // Silently fail
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an image file',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Image size must be less than 5MB',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Axios automatically sets Content-Type to multipart/form-data for FormData
      const response = await api.post('/api/user/avatar', formData);

      // The avatar route returns the updated user - update context directly
      if (response.data && response.data.photoURL) {
        // Update user context with the photoURL from response
        await updateUser({ photoURL: response.data.photoURL });
      }
      setPreviewImage(null);
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to upload image';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
      setPreviewImage(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateUser({ photoURL: null });
      setPreviewImage(null);
      toast({
        title: 'Success',
        description: 'Profile picture removed successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove profile picture',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUser({ displayName, currency });
    } catch (error) {
      // Error already handled in context
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || categoriesLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8 items-center justify-center">
          <p>Please log in to view your settings.</p>
          <Link href="/"><Button>Go to Login</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm text-muted-foreground">
            <Link href="#profile" className="font-semibold text-primary">
              Profile
            </Link>
            <Link href="#currency" className="font-semibold text-primary">
              Currency
            </Link>
            <Link href="#income" className="font-semibold text-primary">
              Income
            </Link>
            <Link href="#categories" className="font-semibold text-primary">
              Categories
            </Link>
            <Link href="/logs" className="font-semibold text-primary flex items-center gap-2">
              Activity Logs
            </Link>
          </nav>
          <div className="grid gap-6">
            <Card id="profile">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center gap-4">
                    <Label>Profile Picture</Label>
                    <div className="relative group">
                      <Avatar className="h-24 w-24 cursor-pointer transition-all duration-300 hover:ring-4 hover:ring-primary/20 ring-offset-2">
                        {(previewImage || user.photoURL) && (
                          <AvatarImage 
                            key={previewImage || user.photoURL}
                            src={previewImage || user.photoURL || ''} 
                            alt={user.displayName || ''}
                            className="transition-all duration-300 object-cover"
                          />
                        )}
                        <AvatarFallback className="text-2xl">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        onClick={handleAvatarClick}
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {user.photoURL ? 'Change' : 'Upload'} Picture
                      </Button>
                      {user.photoURL && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <Card id="currency">
              <CardHeader>
                <CardTitle>Currency Preferences</CardTitle>
                <CardDescription>
                  Select your preferred currency. All amounts will be converted to this currency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleProfileUpdate} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <div id="income">
              <IncomeManagementCard />
            </div>

            <div id="categories">
              <ManageCategoriesCard categories={categories || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
