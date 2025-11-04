import {
  Utensils,
  Car,
  Home,
  Bolt,
  Clapperboard,
  HeartPulse,
  ShoppingBag,
  Package,
  Plane, 
  Train, 
  Bus, 
  Fuel, 
  Gift, 
  BookOpen, 
  GraduationCap, 
  Briefcase,
  Landmark, 
  PiggyBank, 
  Wallet, 
  CreditCard, 
  Receipt, 
  Ticket, 
  Film, 
  Music,
  Gamepad2, 
  Dumbbell, 
  Pill, 
  Stethoscope, 
  Laptop, 
  Phone, 
  Tv, 
  Watch,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryName } from '../lib/types';

export const IconMap: Record<string, LucideIcon> = {
  Utensils, Car, Home, Bolt, Clapperboard, HeartPulse, ShoppingBag, Package,
  Plane, Train, Bus, Fuel, Gift, BookOpen, GraduationCap, Briefcase,
  Landmark, PiggyBank, Wallet, CreditCard, Receipt, Ticket, Film, Music,
  Gamepad2, Dumbbell, Pill, Stethoscope, Laptop, Phone, Tv, Watch
};

// Fallback icon
const DefaultIcon = Package;

export const getIcon = (iconName: string): LucideIcon => {
    return IconMap[iconName] || DefaultIcon;
};

// Kept for legacy components that might still use it
export const CategoryIcons: Record<CategoryName, LucideIcon> = {
  Food: Utensils,
  Transport: Car,
  Housing: Home,
  Utilities: Bolt,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Other: Package,
};
