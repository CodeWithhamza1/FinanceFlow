"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Budget, Category } from '../../lib/types';
import { useEffect, useState } from 'react';
import { convertCurrency } from '../../lib/currency-utils';

interface BudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSetBudgets: (budgets: Budget[]) => void;
  currentBudgets: Budget[];
  categories: Category[];
  currency?: string;
}

const budgetSchema = (categories: Category[]) => z.object({
  budgets: z.array(z.object({
    category: z.enum(categories.length > 0 ? categories.map(c => c.name) as [string, ...string[]] : ['' as string]),
    amount: z.coerce.number().min(0, 'Budget must be non-negative'),
  })),
});


export default function BudgetDialog({ isOpen, onOpenChange, onSetBudgets, currentBudgets, categories, currency = 'USD' }: BudgetDialogProps) {
  
  type FormSchema = z.infer<ReturnType<typeof budgetSchema>>;
  const [converting, setConverting] = useState(false);
  
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<FormSchema>({
    resolver: zodResolver(budgetSchema(categories)),
    defaultValues: {
      budgets: []
    }
  });

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      setConverting(true);
      const convertBudgets = async () => {
        const budgetMap = new Map(currentBudgets.map(b => [b.category, b.amount]));
        const budgetArray = await Promise.all(
          categories.map(async (cat) => {
            const usdAmount = budgetMap.get(cat.name) || 0;
            // Convert from USD to user's currency for display (round for display)
            const displayAmount = currency !== 'USD' && usdAmount > 0
              ? await convertCurrency(usdAmount, 'USD', currency, { roundForDisplay: true })
              : usdAmount;
            return {
              category: cat.name,
              amount: displayAmount
            };
          })
        );
        reset({ budgets: budgetArray });
        setConverting(false);
      };
      convertBudgets();
    }
  }, [isOpen, currentBudgets, reset, categories, currency]);


  const onSubmit = async (data: FormSchema) => {
    // Convert from user's currency back to USD before saving
    const convertedBudgets = await Promise.all(
      data.budgets.map(async (budget) => {
        // Convert from user's currency to USD for storage (preserve precision)
        const usdAmount = currency !== 'USD' && budget.amount > 0
          ? await convertCurrency(budget.amount, currency, 'USD') // Don't round when saving
          : budget.amount;
        return {
          category: budget.category,
          amount: usdAmount
        };
      })
    );
    onSetBudgets(convertedBudgets);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Monthly Budgets</DialogTitle>
          <DialogDescription>
            Define your spending limits for each category. Amounts are in {currency}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="h-72 pr-6">
            <div className="space-y-4">
              {(categories || []).map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor={`budgets.${index}.amount`}>{field.name}</Label>
                  <div>
                    <Input
                      id={`budgets.${index}.amount`}
                      type="number"
                      step="1"
                      {...register(`budgets.${index}.amount`)}
                      disabled={converting}
                    />
                    {/* Hidden input to register the category name */}
                    <input type="hidden" {...register(`budgets.${index}.category`)} value={field.name} />
                     {errors.budgets?.[index]?.amount && (
                      <p className="text-sm text-destructive mt-1">{errors.budgets[index]?.amount?.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={converting}>
              {converting ? 'Loading...' : 'Save Budgets'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
