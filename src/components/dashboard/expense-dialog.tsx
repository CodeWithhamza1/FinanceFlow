"use client"

import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Expense, Category } from '../../lib/types';
import { convertCurrency } from '../../lib/currency-utils';

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (expense: Omit<Expense, 'id' | 'date' | 'userId'>) => void;
  expenseToEdit?: Expense | null;
  categories: Category[];
  currency?: string;
}

const expenseSchema = (categories: Category[]) => z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  category: z.enum(categories.length > 0 ? categories.map(c => c.name) as [string, ...string[]] : ['' as string], {
    errorMap: () => ({ message: 'Please select a category' }),
  }),
});


export default function ExpenseDialog({ isOpen, onOpenChange, onConfirm, expenseToEdit, categories, currency = 'USD' }: ExpenseDialogProps) {
  
  type ExpenseFormData = z.infer<ReturnType<typeof expenseSchema>>;
  const [converting, setConverting] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema(categories)),
    defaultValues: {
      description: '',
      amount: undefined,
      category: undefined,
    }
  });

  const isEditMode = !!expenseToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && expenseToEdit) {
        setConverting(true);
        const loadExpenseData = async () => {
          setValue('description', expenseToEdit.description);
          setValue('category', expenseToEdit.category);
          // Convert from USD to user's currency for display (round for display)
          const displayAmount = currency !== 'USD' && expenseToEdit.amount > 0
            ? await convertCurrency(expenseToEdit.amount, 'USD', currency, { roundForDisplay: true })
            : expenseToEdit.amount;
          setValue('amount', displayAmount);
          setConverting(false);
        };
        loadExpenseData();
      } else {
        reset({ description: '', amount: undefined, category: undefined });
      }
    }
  }, [isOpen, isEditMode, expenseToEdit, setValue, reset, currency]);


  const onSubmit = async (data: ExpenseFormData) => {
    // Convert from user's currency back to USD before saving (preserve precision)
    let finalAmount = data.amount;
    if (currency !== 'USD' && data.amount > 0) {
      finalAmount = await convertCurrency(data.amount, currency, 'USD'); // Don't round when saving
    }
    onConfirm({
      ...data,
      amount: finalAmount
    } as Omit<Expense, 'id' | 'date' | 'userId'>);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onOpenChange(false);
        reset({ description: '', amount: undefined, category: undefined });
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of your transaction.' : 'Enter the details of your transaction below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount')} disabled={converting} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={converting}>
              {converting ? 'Loading...' : (isEditMode ? 'Save Changes' : 'Add Expense')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
