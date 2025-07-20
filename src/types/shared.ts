/**
 * Shared type definitions for SpendGuard
 */

export interface Settings {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
  categoryBudgets?: Record<string, number>;
  monthlyBudget?: number;
  enableSavingsTracking?: boolean;
}

export interface PurchaseContext {
  productName?: string;
  price?: number;
  priceText?: string;
  currency?: string;
  category?: string;
}

export interface SavingsData {
  totalSaved: number;
  interceptsCount: number;
  proceededCount: number;
  lastInterceptDate: number;
  categorySavings: Record<string, number>;
  monthlySavings: Record<string, number>;
  biggestSave: {
    amount: number;
    productName?: string;
    date: number;
  };
}

export interface SpendingInsights {
  totalIntercepts: number;
  thisWeekIntercepts: number;
  thisMonthIntercepts: number;
  averageInterceptValue: number;
  topCategories: Array<{
    category: string;
    count: number;
    totalValue: number;
  }>;
  savingsTrend: Array<{
    date: string;
    amount: number;
  }>;
}

export interface BudgetAlert {
  type: 'warning' | 'danger';
  message: string;
  category?: string;
  currentAmount: number;
  budgetLimit: number;
}
