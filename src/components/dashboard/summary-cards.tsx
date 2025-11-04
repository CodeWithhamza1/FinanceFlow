'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-utils';
import { useCurrencyAmount } from '@/hooks/use-currency-amount';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency?: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass, currency = 'USD' }: { title: string; value: number; icon: React.ElementType, colorClass: string, currency?: string }) => {
  // CONVERSION DISABLED - Display value as-is
  // const { amount: convertedValue } = useCurrencyAmount(value, currency);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 text-muted-foreground ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(value, currency)}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SummaryCards({ totalIncome, totalExpenses, balance, currency = 'USD' }: SummaryCardsProps) {
  return (
    <>
        <StatCard title="Total Income" value={totalIncome} icon={TrendingUp} colorClass="text-green-500" currency={currency} />
        <StatCard title="Total Expenses" value={totalExpenses} icon={TrendingDown} colorClass="text-red-500" currency={currency} />
        <StatCard title="Balance" value={balance} icon={DollarSign} colorClass={balance >= 0 ? 'text-blue-500' : 'text-red-500'} currency={currency} />
    </>
  );
}
