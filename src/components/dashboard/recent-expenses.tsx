import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getIcon } from '../icons';
import type { Expense, Category } from '../../lib/types';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-utils';
import { useCurrencyAmount } from '@/hooks/use-currency-amount';

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  currency?: string;
}

function ExpenseAmount({ amount, currency }: { amount: number; currency: string }) {
  const { amount: convertedAmount } = useCurrencyAmount(amount, currency);
  return <>{formatCurrency(convertedAmount, currency)}</>;
}

export default function RecentExpenses({ expenses, categories, onEdit, onDelete, currency = 'USD' }: RecentExpensesProps) {
  const categoryMap = new Map(categories.map(c => [c.name, c.icon]));

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>Your last 5 transactions. Edit or delete them from here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const iconName = categoryMap.get(expense.category) || 'Package';
              const Icon = getIcon(iconName); 
              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                      <Icon className="h-3.5 w-3.5" />
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ExpenseAmount amount={expense.amount} currency={currency} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {formatDate(expense.date)}
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
