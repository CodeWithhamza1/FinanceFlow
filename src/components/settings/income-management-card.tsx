"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '../../hooks/use-toast';
import { useIncome } from '../../hooks/use-income';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, convertCurrency } from '../../lib/currency-utils';
import { useCurrencyAmount } from '../../hooks/use-currency-amount';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { IncomeEntry } from '../../hooks/use-income';

function DeleteIncomeDialog({ income, currency, onConfirm, onCancel }: {
  income: IncomeEntry;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // CONVERSION DISABLED
  // const { amount: converted } = useCurrencyAmount(income.amount, currency);
  
  return (
    <AlertDialog open={true} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this income entry: <strong>{formatCurrency(income.amount, currency)}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function IncomeManagementCard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const { data, refetch } = useIncome();
  // CONVERSION DISABLED
  // const { amount: convertedTotal } = useCurrencyAmount(data.total, currency);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeEntry | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeEntry | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenDialog = async (income?: IncomeEntry) => {
    if (income) {
      setIncomeToEdit(income);
      // CONVERSION DISABLED - Display as-is
      setAmount(income.amount.toString());
      /* COMMENTED OUT - CONVERSION LOGIC
      if (currency !== 'USD') {
        const displayAmount = await convertCurrency(income.amount, 'USD', currency, { roundForDisplay: true });
        setAmount(displayAmount.toString());
      } else {
        setAmount(income.amount.toString());
      }
      */
      setDescription(income.description || '');
      setDate(new Date(income.date).toISOString().split('T')[0]);
    } else {
      setIncomeToEdit(null);
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIncomeToEdit(null);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!amount || !date) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Amount and date are required',
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Amount must be a valid positive number',
      });
      return;
    }

    setIsLoading(true);
    try {
      // CONVERSION DISABLED - Save as-is
      const payload = {
        amount: parsedAmount,
        description: description || null,
        date,
      };
      
      /* COMMENTED OUT - CONVERSION LOGIC
      // Convert from user's currency to USD for storage
      let finalAmount = parsedAmount;
      if (currency !== 'USD') {
        finalAmount = await convertCurrency(parsedAmount, currency, 'USD', { roundForDisplay: false });
        console.log(`[Income Save] Converting ${parsedAmount} ${currency} -> ${finalAmount} USD`);
      }

      const payload = {
        amount: finalAmount,
        description: description || null,
        date,
      };
      */

      if (incomeToEdit) {
        // Use POST to dedicated update route instead of PUT to avoid routing issues
        await api.post('/api/income/update', {
          id: incomeToEdit.id,
          ...payload,
        });
        toast({ title: 'Success', description: 'Income updated successfully' });
      } else {
        await api.post('/api/income', payload);
        toast({ title: 'Success', description: 'Income added successfully' });
      }
      refetch();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Save income error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save income';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!incomeToDelete) return;

    setIsLoading(true);
    try {
      // Use POST to dedicated delete route instead of DELETE on dynamic route
      await api.post('/api/income/delete', { id: incomeToDelete.id });
      toast({ title: 'Success', description: 'Income deleted successfully' });
      refetch();
      setIncomeToDelete(null);
    } catch (error: any) {
      console.error('Delete income error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete income';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Income Management</CardTitle>
          <CardDescription>
            Add, edit, or delete your income entries. Total monthly income: <strong>{formatCurrency(data.total, currency)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income entries yet. Add your first income entry.</p>
            ) : (
              <div className="space-y-2">
                {data.entries.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(income.amount, currency)}</p>
                      {income.description && (
                        <p className="text-sm text-muted-foreground">{income.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(income.date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(income)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setIncomeToDelete(income)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Income Entry
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{incomeToEdit ? 'Edit Income' : 'Add Income'}</DialogTitle>
            <DialogDescription>
              Enter the amount and date for this income entry. Amount will be saved as entered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount ({currency})</Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-description">Description (Optional)</Label>
              <Input
                id="income-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Salary, Freelance work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-date">Date</Label>
              <Input
                id="income-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : incomeToEdit ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {incomeToDelete && (
        <DeleteIncomeDialog
          income={incomeToDelete}
          currency={currency}
          onConfirm={handleDelete}
          onCancel={() => setIncomeToDelete(null)}
        />
      )}
    </>
  );
}

