"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { PlusCircle, Landmark, Loader2, Trash2 } from 'lucide-react';
import SummaryCards from './summary-cards';
import SpendingChart from './spending-chart';
import BudgetProgress from './budget-progress';
import RecentExpenses from './recent-expenses';
import ExpenseDialog from './expense-dialog';
import BudgetDialog from './budget-dialog';
import type { Expense, Budget, Category } from '../../lib/types';
import { initialBudgets } from '../../lib/data';
import { useAuth } from '@/contexts/auth-context';
import { useExpenses } from '../../hooks/use-expenses';
import { useBudgets } from '../../hooks/use-budgets';
import { useCategories } from '../../hooks/use-categories';
import { useIncome } from '../../hooks/use-income';
import api from '@/lib/api';
import { useToast } from '../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import AiRecommendationCard from './ai-recommendation-card';

export default function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // --- Data Fetching ---
  const { data: expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { data: budgets, loading: budgetsLoading, refetch: refetchBudgets } = useBudgets();
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: incomeData, loading: incomeLoading, refetch: refetchIncomeData } = useIncome();
  
  // Get current month for income
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: currentMonthIncome, refetch: refetchCurrentMonthIncome } = useIncome(currentMonth);
  
  const income = currentMonthIncome.total || incomeData.total || 0;

  // --- Memoized Calculations ---
  const totalExpenses = useMemo(() => 
    (expenses || []).reduce((acc, expense) => acc + expense.amount, 0),
    [expenses]
  );
  
  const balance = useMemo(() => income - totalExpenses, [income, totalExpenses]);

  const expensesByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = (expenses || []).reduce((acc, expense) => {
        if (!acc[expense.category]) {
            acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
    }, {} as Record<string, number>);

    return (categories || []).map(category => ({
        category: category.name,
        total: categoryMap[category.name] || 0,
        icon: category.icon,
    }));
  }, [expenses, categories]);
  
  const expensesForAI = useMemo(() => {
    return (expenses || []).reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>)
  }, [expenses]);

  // Get recent expenses (limit 5)
  const { data: recentExpenses, loading: recentExpensesLoading, refetch: refetchRecentExpenses } = useExpenses(5);

  // --- Actions ---
  const handleAddOrUpdateExpense = async (expenseData: Omit<Expense, 'id' | 'date' | 'userId'>) => {
    if (!user) return;

    try {
      if (expenseToEdit) {
        // Update existing expense - preserve original date
        let dateToSend: string;
        try {
          if (expenseToEdit.date instanceof Date) {
            dateToSend = expenseToEdit.date.toISOString();
          } else if (typeof expenseToEdit.date === 'string') {
            const dateObj = new Date(expenseToEdit.date);
            dateToSend = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
          } else {
            dateToSend = new Date().toISOString();
          }
        } catch (e) {
          dateToSend = new Date().toISOString();
        }

        const updateData = {
          id: expenseToEdit.id,
          description: expenseData.description?.trim(),
          amount: Number(expenseData.amount),
          category: expenseData.category,
          date: dateToSend,
        };

        // Validate data before sending
        if (!updateData.description || !updateData.category || !updateData.amount || isNaN(updateData.amount)) {
          toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Please fill in all required fields with valid values.',
          });
          return;
        }

        // Use POST to /api/expenses/update instead of PUT to avoid routing issues
        await api.post('/api/expenses/update', updateData);
        
        toast({ title: "Success", description: "Expense updated successfully." });
        // Refetch all related data immediately
        await Promise.all([
          refetchExpenses(),
          refetchRecentExpenses(),
        ]);
        closeExpenseDialog();
      } else {
        // Add new expense - use current date
        await api.post('/api/expenses', {
          ...expenseData,
          date: new Date().toISOString(),
        });
        toast({ title: "Success", description: "Expense added successfully." });
        // Refetch all related data immediately
        await Promise.all([
          refetchExpenses(),
          refetchRecentExpenses(),
        ]);
        closeExpenseDialog();
      }
    } catch (error: any) {
      console.error('Save expense error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save expense';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };
  
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      // Use POST to dedicated delete route instead of DELETE on dynamic route
      await api.post('/api/expenses/delete', { id: expenseToDelete.id });
      toast({ title: "Success", description: "Expense deleted successfully." });
      // Refetch all related data immediately
      await Promise.all([
        refetchExpenses(),
        refetchRecentExpenses(),
      ]);
      setExpenseToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete expense',
      });
    }
  };

  const handleSetBudgets = async (updatedBudgets: Budget[]) => {
    try {
      await api.post('/api/budgets', { budgets: updatedBudgets });
      toast({ title: "Success", description: "Budgets updated successfully." });
      // Refetch budgets immediately
      await refetchBudgets();
      setBudgetDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update budgets',
      });
    }
  };

  const openEditExpenseDialog = (expense: Expense) => {
    setExpenseToEdit(expense);
    setExpenseDialogOpen(true);
  };
  
  const openDeleteExpenseDialog = (expense: Expense) => {
    setExpenseToDelete(expense);
  }

  const closeExpenseDialog = () => {
    setExpenseToEdit(null);
    setExpenseDialogOpen(false);
  }

  if (expensesLoading || budgetsLoading || recentExpensesLoading || categoriesLoading || incomeLoading) {
      return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setBudgetDialogOpen(true)}>
            <Landmark className="mr-2 h-4 w-4" /> Set Budgets
          </Button>
          <Button onClick={() => setExpenseDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <SummaryCards 
          totalIncome={income} 
          totalExpenses={totalExpenses} 
          balance={balance} 
          currency={user?.currency || 'USD'} 
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={expensesByCategory} currency={user?.currency || 'USD'} />
        </div>
        <BudgetProgress 
          budgets={budgets.length > 0 ? budgets : initialBudgets} 
          expenses={expenses || []} 
          categories={categories || []}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2">
           <RecentExpenses 
              expenses={recentExpenses || []}
              categories={categories || []}
              onEdit={openEditExpenseDialog}
              onDelete={openDeleteExpenseDialog}
              currency={user?.currency || 'USD'}
            />
         </div>
            <AiRecommendationCard 
              income={income} 
              expenses={expensesForAI}
              totalExpenses={totalExpenses}
              balance={balance}
              budgets={budgets.reduce((acc, budget) => {
                acc[budget.category] = budget.amount;
                return acc;
              }, {} as Record<string, number>)}
              expensesByCategory={expensesByCategory}
              recentExpenses={recentExpenses || []}
            />
      </div>
      
      <ExpenseDialog
        isOpen={isExpenseDialogOpen}
        onOpenChange={closeExpenseDialog}
        onConfirm={handleAddOrUpdateExpense}
        expenseToEdit={expenseToEdit}
        categories={categories || []}
        currency={user?.currency || 'USD'}
      />
      
      <BudgetDialog
        isOpen={isBudgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        onSetBudgets={handleSetBudgets}
        currentBudgets={budgets.length > 0 ? budgets : initialBudgets}
        categories={categories || []}
        currency={user?.currency || 'USD'}
      />
      
       <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              expense: <span className="font-semibold">"{expenseToDelete?.description}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
