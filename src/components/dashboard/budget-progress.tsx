'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { getIcon } from '../icons';
import type { Budget, Expense, Category } from '../../lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { formatCurrency } from '@/lib/currency-utils';
import { useCurrencyAmount } from '@/hooks/use-currency-amount';
import { useAuth } from '@/contexts/auth-context';

interface BudgetProgressProps {
  budgets: Budget[];
  expenses: Expense[];
  categories: Category[];
}

export default function BudgetProgress({ budgets, expenses, categories }: BudgetProgressProps) {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  
  const spendingByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const categoryMap = new Map(categories.map(c => [c.name, c.icon]));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Budget Goals</CardTitle>
        <CardDescription>Your progress towards monthly budgets.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          <div className="space-y-4 pr-4">
            {budgets.filter(b => b.amount > 0).map((budget) => {
              const spent = spendingByCategory[budget.category] || 0;
              const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              const iconName = categoryMap.get(budget.category) || 'Package';
              const Icon = getIcon(iconName);

              return (
                <BudgetItem
                  key={budget.category}
                  category={budget.category}
                  icon={Icon}
                  budget={budget.amount}
                  spent={spent}
                  progress={progress}
                  currency={currency}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function BudgetItem({ category, icon: Icon, budget, spent, progress, currency }: {
  category: string;
  icon: React.ElementType;
  budget: number;
  spent: number;
  progress: number;
  currency: string;
}) {
  const { amount: convertedSpent } = useCurrencyAmount(spent, currency);
  const { amount: convertedBudget } = useCurrencyAmount(budget, currency);
  const convertedProgress = convertedBudget > 0 ? (convertedSpent / convertedBudget) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{category}</span>
        </div>
        <span className={progress > 100 ? 'text-destructive' : 'text-muted-foreground'}>
          {formatCurrency(convertedSpent, currency)} / {formatCurrency(convertedBudget, currency)}
        </span>
      </div>
      <Progress value={convertedProgress} className={progress > 100 ? '[&>div]:bg-destructive' : ''} />
    </div>
  );
}
