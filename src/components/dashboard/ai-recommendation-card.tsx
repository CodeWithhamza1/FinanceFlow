"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sparkles, Loader2, Save, BookOpen, Trash2, Eye } from "lucide-react";
import { getAIPoweredBudgetRecommendation } from "../../ai/flows/ai-powered-budget-recommendation";
import { useToast } from "../../hooks/use-toast";
import { formatCurrency } from "../../lib/currency-utils";
import { useAuth } from "../../contexts/auth-context";
import api from "../../lib/api";
import { MarkdownRenderer } from "../ui/markdown-renderer";

interface AiRecommendationCardProps {
  income: number;
  expenses: Record<string, number>;
  totalExpenses: number;
  balance: number;
  budgets?: Record<string, number>;
  expensesByCategory?: Array<{ category: string; total: number; icon?: string }>;
  recentExpenses?: Array<{ description: string; amount: number; category: string; date: Date | string }>;
}

export default function AiRecommendationCard({ 
  income, 
  expenses, 
  totalExpenses,
  balance,
  budgets = {},
  expensesByCategory = [],
  recentExpenses = []
}: AiRecommendationCardProps) {
  const [isOpen, setOpen] = React.useState(false);
  const [isSavedDialogOpen, setSavedDialogOpen] = React.useState(false);
  const [savingsGoal, setSavingsGoal] = React.useState(1000);
  const [recommendation, setRecommendation] = React.useState<string | null>(null);
  const [isLoading, setLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveTitle, setSaveTitle] = React.useState('');
  const [savedRecommendations, setSavedRecommendations] = React.useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = React.useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = React.useState<any | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';

  const handleGetRecommendation = async () => {
    const hasExpenses = Object.keys(expenses).length > 0;
    
    if (!hasExpenses) {
      toast({
        variant: "destructive",
        title: "No Expense Data",
        description: "Please add some expenses first to get personalized recommendations.",
      });
      return;
    }

    setLoading(true);
    setRecommendation(null);
    setSaveTitle(''); // Reset save title
    try {
      // Calculate analytics
      const topCategories = expensesByCategory
        .filter(cat => cat.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(cat => ({
          category: cat.category,
          amount: cat.total,
          percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0,
        }));

      // Calculate budget vs actual
      const budgetVsActual: Record<string, { budget: number; actual: number; difference: number; percentage: number }> = {};
      Object.keys(budgets).forEach(category => {
        const budget = budgets[category];
        const actual = expenses[category] || 0;
        const difference = actual - budget;
        const percentage = budget > 0 ? (difference / budget) * 100 : 0;
        budgetVsActual[category] = { budget, actual, difference, percentage };
      });

      // Analyze spending trends
      let spendingTrends = '';
      if (recentExpenses.length > 0) {
        const dailySpending = recentExpenses.reduce((acc, exp) => {
          const date = typeof exp.date === 'string' ? exp.date : exp.date.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const dailyAmounts = Object.values(dailySpending);
        if (dailyAmounts.length > 1) {
          const avgDaily = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
          const maxDaily = Math.max(...dailyAmounts);
          const minDaily = Math.min(...dailyAmounts);
          spendingTrends = `Average daily spending: $${avgDaily.toFixed(2)}. Range: $${minDaily.toFixed(2)} - $${maxDaily.toFixed(2)}.`;
        }
      }

      const expenseAnalytics = {
        topCategories,
        categoryBreakdown: expenses,
        spendingTrends,
        budgetVsActual: Object.keys(budgetVsActual).length > 0 ? budgetVsActual : undefined,
      };

      // Format recent expenses for AI
      const formattedRecentExpenses = recentExpenses.slice(0, 10).map(exp => ({
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        date: typeof exp.date === 'string' 
          ? new Date(exp.date).toLocaleDateString() 
          : exp.date.toLocaleDateString(),
      }));

      const result = await getAIPoweredBudgetRecommendation({
        income,
        expenses,
        savingsGoal,
        totalExpenses,
        balance,
        budgets: Object.keys(budgets).length > 0 ? budgets : undefined,
        expenseAnalytics,
        recentExpenses: formattedRecentExpenses.length > 0 ? formattedRecentExpenses : undefined,
      });
      setRecommendation(result.recommendations);
    } catch (error: any) {
      console.error("AI Recommendation Error:", error);
      
      // Check if it's an API key error
      const errorMessage = error?.message || error?.toString() || '';
      const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('api key');
      
      toast({
        variant: "destructive",
        title: "AI Recommendation Error",
        description: isApiKeyError 
          ? "Google AI API key is not configured. Please add GOOGLE_GENAI_API_KEY to your .env.local file."
          : "Failed to get AI recommendation. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecommendation = async () => {
    if (!recommendation) return;

    setIsSaving(true);
    try {
      await api.post('/api/ai-recommendations', {
        title: saveTitle || `AI Recommendation - ${new Date().toLocaleDateString()}`,
        recommendation,
        income,
        savingsGoal,
        expensesSummary: expenses,
      });
      toast({
        title: "Success",
        description: "AI recommendation saved successfully!",
      });
      setSaveTitle('');
      setRecommendation(null); // Clear recommendation after saving
      setOpen(false);
    } catch (error: any) {
      console.error("Save recommendation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to save recommendation. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedRecommendations = async () => {
    setIsLoadingSaved(true);
    setSavedDialogOpen(true);
    try {
      const response = await api.get('/api/ai-recommendations');
      setSavedRecommendations(response.data.recommendations || []);
    } catch (error: any) {
      console.error("Load saved recommendations error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved recommendations.",
      });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await api.post('/api/ai-recommendations/delete', { id });
      toast({
        title: "Success",
        description: "Recommendation deleted successfully!",
      });
      // Close detail dialog if deleting the selected one
      if (selectedRecommendation?.id === id) {
        setDetailDialogOpen(false);
        setSelectedRecommendation(null);
      }
      // Reload saved recommendations
      const response = await api.get('/api/ai-recommendations');
      setSavedRecommendations(response.data.recommendations || []);
    } catch (error: any) {
      console.error("Delete recommendation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to delete recommendation.",
      });
    }
  };

  const handleViewDetail = (rec: any) => {
    setSelectedRecommendation(rec);
    setDetailDialogOpen(true);
  };

  const getPreviewText = (text: string, maxLength: number = 150): string => {
    if (!text) return '';
    // Remove markdown formatting for preview
    const plainText = text
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\\n/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI-Powered Advice
          </CardTitle>
          <CardDescription>
            Get personalized tips to improve your budget and reach your savings goals faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="bg-accent/50 border-l-4 border-accent p-4 rounded-md">
            <p className="text-sm text-foreground/80">
              {Object.keys(expenses).length > 0 
                ? "Our smart assistant can analyze your spending and suggest ways to save more effectively."
                : "Add some expenses to get personalized budget recommendations based on your spending patterns."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="flex-1" onClick={() => setOpen(true)}>
            Get AI Recommendation
          </Button>
          <Button variant="outline" onClick={handleLoadSavedRecommendations}>
            <BookOpen className="h-4 w-4 mr-2" />
            Saved
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Budget Recommendation</DialogTitle>
            <DialogDescription>
              Let us know your monthly savings goal to get tailored advice. Your current income is {formatCurrency(income, currency)}.
            </DialogDescription>
          </DialogHeader>

          {!recommendation && !isLoading && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="savingsGoal">Monthly Savings Goal</Label>
                <Input
                  id="savingsGoal"
                  type="number"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(Number(e.target.value))}
                  placeholder="e.g., 1000"
                />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {recommendation && (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto my-4 bg-muted/50 p-6 rounded-lg border">
                <MarkdownRenderer 
                  content={recommendation} 
                  className="text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="save-title">Save with title (optional)</Label>
                <Input
                  id="save-title"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g., Monthly Budget Plan - January 2024"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {recommendation ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => {
                  setOpen(false);
                  setRecommendation(null);
                  setSaveTitle('');
                }}>
                  Close
                </Button>
                <Button onClick={handleSaveRecommendation} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Recommendation'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleGetRecommendation} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Get Advice'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Recommendations Dialog - Grid View */}
      <Dialog open={isSavedDialogOpen} onOpenChange={setSavedDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Saved AI Recommendations</DialogTitle>
            <DialogDescription>
              Click on a card to view the full recommendation. {savedRecommendations.length > 0 && `You have ${savedRecommendations.length} saved recommendation${savedRecommendations.length !== 1 ? 's' : ''}.`}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSaved ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedRecommendations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No saved recommendations yet.</p>
              <p className="text-sm mt-2">Save recommendations to access them later.</p>
            </div>
          ) : (
            <div className="max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {savedRecommendations.map((rec) => (
                  <Card
                    key={rec.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
                    onClick={() => handleViewDetail(rec)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {rec.title || `Recommendation - ${new Date(rec.createdAt).toLocaleDateString()}`}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSaved(rec.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {new Date(rec.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {rec.income > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Income: <span className="font-medium text-foreground">{formatCurrency(rec.income, currency)}</span>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Goal: <span className="font-medium text-foreground">{formatCurrency(rec.savingsGoal, currency)}</span>
                            </span>
                          </div>
                        )}
                        
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(rec);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recommendation Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedRecommendation?.title || `Recommendation - ${selectedRecommendation ? new Date(selectedRecommendation.createdAt).toLocaleDateString() : ''}`}
            </DialogTitle>
            <DialogDescription>
              {selectedRecommendation && (
                <div className="flex flex-wrap gap-4 text-sm mt-2">
                  <span>
                    Saved on {new Date(selectedRecommendation.createdAt).toLocaleString()}
                  </span>
                  {selectedRecommendation.income > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        Income: {formatCurrency(selectedRecommendation.income, currency)} | 
                        Savings Goal: {formatCurrency(selectedRecommendation.savingsGoal, currency)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="max-h-[65vh] overflow-y-auto">
              <div className="bg-muted/30 p-6 rounded-lg border">
                <MarkdownRenderer 
                  content={selectedRecommendation.recommendation} 
                  className="text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRecommendation) {
                  handleDeleteSaved(selectedRecommendation.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
