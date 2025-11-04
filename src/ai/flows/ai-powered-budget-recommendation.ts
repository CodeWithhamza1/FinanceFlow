'use server';
/**
 * @fileOverview AI-powered budget recommendation flow.
 *
 * This file defines a Genkit flow that provides users with recommendations on how to adjust their budget in different
 * categories to maximize savings.
 *
 * @interface AIPoweredBudgetRecommendationInput - Defines the input schema for the flow.
 * @interface AIPoweredBudgetRecommendationOutput - Defines the output schema for the flow.
 * @function getAIPoweredBudgetRecommendation - The main function to trigger the budget recommendation flow.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

// Define the input schema for the AI-powered budget recommendation
const AIPoweredBudgetRecommendationInputSchema = z.object({
  income: z.number().describe('The user\'s monthly income.'),
  expenses: z
    .record(z.number())
    .describe(
      'A map of expense categories to the amount spent in each category.'
    ),
  savingsGoal: z
    .number()
    .describe(
      'The user\'s desired monthly savings amount.  If the savings goal is already reached, recommend how to invest the additional funds, with different risk profiles.'
    ),
  totalExpenses: z.number().describe('Total amount spent across all categories.'),
  balance: z.number().describe('Current balance (income - total expenses).'),
  budgets: z
    .record(z.number())
    .optional()
    .describe('Budget limits for each category (if set).'),
  expenseAnalytics: z
    .object({
      topCategories: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
      })),
      categoryBreakdown: z.record(z.number()),
      spendingTrends: z.string().optional(),
      budgetVsActual: z.record(z.object({
        budget: z.number(),
        actual: z.number(),
        difference: z.number(),
        percentage: z.number(),
      })).optional(),
    })
    .optional()
    .describe('Detailed analytics about spending patterns.'),
  recentExpenses: z
    .array(z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    }))
    .optional()
    .describe('Recent expense transactions for pattern analysis.'),
});

export type AIPoweredBudgetRecommendationInput = z.infer<
  typeof AIPoweredBudgetRecommendationInputSchema
>;

// Define the output schema for the AI-powered budget recommendation
const AIPoweredBudgetRecommendationOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'AI-powered recommendations on how to adjust the budget in different categories to maximize savings. Or if the savings goal is reached, recommendations on how to invest any additional funds, taking into account different risk profiles. The output should be a markdown-formatted string.'
    ),
});

export type AIPoweredBudgetRecommendationOutput = z.infer<
  typeof AIPoweredBudgetRecommendationOutputSchema
>;

// Define the AI-powered budget recommendation flow
const aiPoweredBudgetRecommendationFlow = ai.defineFlow(
  {
    name: 'aiPoweredBudgetRecommendationFlow',
    inputSchema: AIPoweredBudgetRecommendationInputSchema,
    outputSchema: AIPoweredBudgetRecommendationOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredBudgetRecommendationPrompt(input);
    return output!;
  }
);

// Define the prompt for the AI-powered budget recommendation
const aiPoweredBudgetRecommendationPrompt = ai.definePrompt({
  name: 'aiPoweredBudgetRecommendationPrompt',
  input: {schema: AIPoweredBudgetRecommendationInputSchema},
  output: {schema: AIPoweredBudgetRecommendationOutputSchema},
  prompt: async (input) => {
    const savingsRate = input.balance > 0 && input.income > 0 
      ? ((input.balance / input.income) * 100).toFixed(1) 
      : '0';
    
    let expenseBreakdown = '';
    Object.entries(input.expenses).forEach(([category, amount]) => {
      const percentage = input.totalExpenses > 0 
        ? ((amount / input.totalExpenses) * 100).toFixed(1) 
        : '0';
      expenseBreakdown += `- **${category}:** $${amount.toFixed(2)} (${percentage}% of total)\n`;
    });

    let analyticsSection = '';
    if (input.expenseAnalytics) {
      let topCategories = '';
      input.expenseAnalytics.topCategories.forEach((cat, index) => {
        topCategories += `${index + 1}. **${cat.category}:** $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}% of total expenses)\n`;
      });

      let budgetAnalysis = '';
      if (input.expenseAnalytics.budgetVsActual) {
        Object.entries(input.expenseAnalytics.budgetVsActual).forEach(([category, data]) => {
          if (data.difference > 0) {
            budgetAnalysis += `- **${category}:**\n  - Budget: $${data.budget.toFixed(2)}\n  - Actual: $${data.actual.toFixed(2)}\n  - Over budget by $${data.difference.toFixed(2)} (${data.percentage.toFixed(1)}% over)\n`;
          } else {
            budgetAnalysis += `- **${category}:**\n  - Budget: $${data.budget.toFixed(2)}\n  - Actual: $${data.actual.toFixed(2)}\n  - Under budget by $${Math.abs(data.difference).toFixed(2)}\n`;
          }
        });
      }

      analyticsSection = `## SPENDING ANALYTICS:

### Top Spending Categories:
${topCategories}
${budgetAnalysis ? `### Budget vs Actual Analysis:\n${budgetAnalysis}` : ''}
${input.expenseAnalytics.spendingTrends ? `### Spending Patterns:\n${input.expenseAnalytics.spendingTrends}\n` : ''}`;
    }

    let recentExpensesSection = '';
    if (input.recentExpenses && input.recentExpenses.length > 0) {
      recentExpensesSection = `### Recent Transactions (Pattern Analysis):\n`;
      input.recentExpenses.forEach(exp => {
        recentExpensesSection += `- ${exp.date}: $${exp.amount.toFixed(2)} on ${exp.description} (${exp.category})\n`;
      });
    }

    let budgetsSection = '';
    if (input.budgets) {
      budgetsSection = `## BUDGET LIMITS SET:\n`;
      Object.entries(input.budgets).forEach(([category, amount]) => {
        budgetsSection += `- **${category}:** Budget limit of $${amount.toFixed(2)}\n`;
      });
    }

    return `You are an expert personal finance advisor with deep knowledge of budgeting, financial planning, and investment strategies. Analyze the user's complete financial dashboard and provide sharp, specific, and highly actionable recommendations.

## CRITICAL INSTRUCTIONS:
1. Be SPECIFIC with numbers and percentages - don't give vague advice
2. Identify the EXACT problem areas and provide PRECISE solutions
3. Prioritize recommendations by impact (highest savings potential first)
4. Use the analytics data to spot patterns and trends
5. Compare budget vs actual spending to identify overruns
6. Provide concrete action steps, not general advice
7. If savings goal is met, provide sophisticated investment advice with risk profiles
8. Format your response as clear, well-structured markdown

## FINANCIAL OVERVIEW:
- **Monthly Income:** $${input.income.toFixed(2)}
- **Total Expenses:** $${input.totalExpenses.toFixed(2)}
- **Current Balance:** $${input.balance.toFixed(2)}
- **Savings Goal:** $${input.savingsGoal.toFixed(2)}
- **Savings Rate:** ${savingsRate}%

## EXPENSE BREAKDOWN:
${expenseBreakdown}
${analyticsSection}
${recentExpensesSection}
${budgetsSection}
## YOUR TASK:
Analyze this comprehensive financial data and provide:

1. **IMMEDIATE ACTION ITEMS** (3-5 specific, prioritized recommendations with exact amounts)
2. **CATEGORY-SPECIFIC OPTIMIZATIONS** (which categories to cut, by how much, and why)
3. **SPENDING PATTERN INSIGHTS** (identify wasteful patterns from recent expenses)
4. **BUDGET ALIGNMENT** (if budgets are set, show where they're being exceeded and how to fix it)
5. **SAVINGS STRATEGY** (if savings goal isn't met, provide exact path to reach it; if met, provide investment advice)
6. **RISK-BASED INVESTMENT RECOMMENDATIONS** (if savings goal is exceeded, provide sophisticated investment strategies for different risk profiles)

Be analytical, specific, and actionable. Focus on the biggest impact areas first.`;
  },
});

/**
 * Provides AI-powered recommendations on how to adjust the budget in different
 * categories to maximize savings.
 *
 * @param input - The input containing income, expenses, and savings goal.
 * @returns The AI-powered budget recommendations.
 */
export async function getAIPoweredBudgetRecommendation(
  input: AIPoweredBudgetRecommendationInput
): Promise<AIPoweredBudgetRecommendationOutput> {
  return aiPoweredBudgetRecommendationFlow(input);
}
