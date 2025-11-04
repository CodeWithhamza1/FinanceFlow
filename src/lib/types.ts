export type CategoryName = 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Entertainment' | 'Health' | 'Shopping' | 'Other' | string;


export interface Expense {
  id: string;
  date: Date; // This will be a Firestore Timestamp, but we'll work with Date objects on the client
  description: string;
  amount: number;
  category: CategoryName;
  userId: string;
}

export interface Budget {
  category: CategoryName;
  amount: number;
}

// This represents the structure of the budget document for a user
export interface UserBudgets {
    userId: string;
    budgets: Budget[];
}

export interface Category {
  id: string;
  name: CategoryName;
  icon: string;
}
