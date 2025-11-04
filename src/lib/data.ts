import type { CategoryName } from './types';

// This is now the list of DEFAULT categories for new users.
export const defaultCategories: {name: CategoryName, icon: string}[] = [
  { name: 'Food', icon: 'Utensils' },
  { name: 'Transport', icon: 'Car' },
  { name: 'Housing', icon: 'Home' },
  { name: 'Utilities', icon: 'Bolt' },
  { name: 'Entertainment', icon: 'Clapperboard' },
  { name: 'Health', icon: 'HeartPulse' },
  { name: 'Shopping', icon: 'ShoppingBag' },
  { name: 'Other', icon: 'Package' },
];

// This will be used to create an initial budget for new users.
export const initialBudgets = defaultCategories.map(c => ({
  category: c.name,
  amount: 0,
}));

initialBudgets[0].amount = 400; // Food
initialBudgets[1].amount = 150; // Transport
initialBudgets[2].amount = 1200; // Housing
initialBudgets[3].amount = 250; // Utilities
initialBudgets[4].amount = 100; // Entertainment
initialBudgets[5].amount = 100; // Health
initialBudgets[6].amount = 200; // Shopping
initialBudgets[7].amount = 50; // Other

export const iconList = [
    'Utensils', 'Car', 'Home', 'Bolt', 'Clapperboard', 'HeartPulse', 'ShoppingBag', 'Package',
    'Plane', 'Train', 'Bus', 'Fuel', 'Gift', 'BookOpen', 'GraduationCap', 'Briefcase',
    'Landmark', 'PiggyBank', 'Wallet', 'CreditCard', 'Receipt', 'Ticket', 'Film', 'Music',
    'Gamepad2', 'Dumbbell', 'Pill', 'Stethoscope', 'Laptop', 'Phone', 'Tv', 'Watch'
];
