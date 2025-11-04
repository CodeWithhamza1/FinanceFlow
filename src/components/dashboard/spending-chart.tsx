"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../ui/chart"
import { getIcon } from "../icons"
import { formatCurrency } from "@/lib/currency-utils"
import { useCurrencyAmount } from "@/hooks/use-currency-amount"

interface SpendingChartProps {
  data: { category: string; total: number; icon: string }[];
  currency?: string;
}

const generateChartConfig = (data: SpendingChartProps['data']): ChartConfig => {
  const config: ChartConfig = {
    amount: {
      label: "Amount",
    },
  };
  data.forEach((item, index) => {
    config[item.category] = {
      label: item.category,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
      icon: getIcon(item.icon),
    };
  });
  return config;
}


export default function SpendingChart({ data, currency = 'USD' }: SpendingChartProps) {
    const chartData = data.filter(d => d.total > 0);
    const chartConfig = generateChartConfig(chartData);

    const total = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.total, 0)
    }, [chartData])
    
    const { amount: convertedTotal } = useCurrencyAmount(total, currency);
    
    return (
        <Card className="flex flex-col h-full">
        <CardHeader className="items-center pb-0">
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Breakdown of your monthly expenses</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
            <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
            >
            <PieChart>
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" />}
                />
                <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="category"
                    innerRadius="60%"
                    strokeWidth={5}
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.category} fill={chartConfig[entry.category as keyof typeof chartConfig]?.color} />
                    ))}
                </Pie>
                <ChartLegend
                    content={<ChartLegendContent nameKey="category" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
            </PieChart>
            </ChartContainer>
        </CardContent>
        <CardContent className="flex-1 flex items-center justify-center p-0">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">
                    {formatCurrency(convertedTotal, currency)}
                </p>
            </div>
        </CardContent>
        </Card>
    )
}
