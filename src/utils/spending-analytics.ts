/**
 * Smart Spending Analytics for SpendGuard
 * Provides insights into spending patterns and budget tracking
 */

interface SpendingPattern {
  category: string;
  monthlyTotal: number;
  transactionCount: number;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface BudgetAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  percentage: number;
}

interface SpendingInsight {
  type: 'monthly_limit' | 'category_warning' | 'impulse_pattern' | 'seasonal_trend';
  title: string;
  description: string;
  actionSuggestion?: string;
}

export class SpendingAnalytics {
  
  /**
   * Analyze current purchase against user's spending patterns
   */
  static async analyzeCurrentPurchase(
    context: any, 
    userSettings: any
  ): Promise<{
    shouldIncreaseDelay: boolean;
    customMessage: string;
    budgetAlert?: BudgetAlert;
    insights: SpendingInsight[];
  }> {
    
    const purchases = await this.getRecentPurchases();
    const patterns = this.analyzeSpendingPatterns(purchases);
    
    let shouldIncreaseDelay = false;
    let customMessage = "Take a moment to consider this purchase.";
    const insights: SpendingInsight[] = [];
    
    // Check monthly spending
    if (context.price && context.category) {
      const monthlySpend = this.getMonthlySpendInCategory(purchases, context.category);
      const budgetLimit = userSettings.categoryBudgets?.[context.category] || 500;
      
      if (monthlySpend + context.price > budgetLimit) {
        shouldIncreaseDelay = true;
        customMessage = `Adding this purchase would exceed your monthly ${context.category} budget of $${budgetLimit}.`;
        
        insights.push({
          type: 'monthly_limit',
          title: 'Budget Limit Exceeded',
          description: `You've spent $${monthlySpend} of $${budgetLimit} this month in ${context.category}.`,
          actionSuggestion: 'Consider waiting until next month or adjusting your budget.'
        });
      }
    }
    
    // Detect impulse buying patterns
    const recentPurchases = purchases.filter(p => 
      Date.now() - p.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    if (recentPurchases.length >= 3) {
      shouldIncreaseDelay = true;
      customMessage = "You've made several purchases recently. This might be an impulse buying session.";
      
      insights.push({
        type: 'impulse_pattern',
        title: 'Impulse Buying Detected',
        description: `You've made ${recentPurchases.length} purchases in the last 24 hours.`,
        actionSuggestion: 'Take a break from shopping and revisit this tomorrow.'
      });
    }
    
    // Check for similar recent purchases
    if (context.category) {
      const similarRecent = purchases.filter(p => 
        p.category === context.category && 
        Date.now() - p.timestamp < 7 * 24 * 60 * 60 * 1000 // Last week
      );
      
      if (similarRecent.length >= 2) {
        insights.push({
          type: 'category_warning',
          title: 'Frequent Category Purchases',
          description: `You've purchased ${similarRecent.length} ${context.category} items this week.`,
          actionSuggestion: 'Do you really need another item in this category?'
        });
      }
    }
    
    // Generate budget alert if applicable
    let budgetAlert: BudgetAlert | undefined;
    if (context.category && userSettings.categoryBudgets?.[context.category]) {
      const monthlySpend = this.getMonthlySpendInCategory(purchases, context.category);
      const budget = userSettings.categoryBudgets[context.category];
      const percentage = (monthlySpend / budget) * 100;
      
      if (percentage >= 90) {
        budgetAlert = {
          type: 'danger',
          message: `You've used ${percentage.toFixed(0)}% of your ${context.category} budget`,
          percentage
        };
      } else if (percentage >= 75) {
        budgetAlert = {
          type: 'warning',
          message: `You're at ${percentage.toFixed(0)}% of your ${context.category} budget`,
          percentage
        };
      }
    }
    
    return {
      shouldIncreaseDelay,
      customMessage,
      budgetAlert,
      insights
    };
  }

  private static async getRecentPurchases(): Promise<any[]> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getRecentPurchases' }, (response: any) => {
        resolve(response?.purchases || []);
      });
    });
  }

  private static analyzeSpendingPatterns(purchases: any[]): SpendingPattern[] {
    const patterns = new Map<string, SpendingPattern>();
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Filter to last 30 days
    const recentPurchases = purchases.filter(p => p.timestamp > thirtyDaysAgo);
    
    for (const purchase of recentPurchases) {
      const category = purchase.category || 'Other';
      
      if (!patterns.has(category)) {
        patterns.set(category, {
          category,
          monthlyTotal: 0,
          transactionCount: 0,
          averageAmount: 0,
          trend: 'stable'
        });
      }
      
      const pattern = patterns.get(category)!;
      pattern.monthlyTotal += purchase.amount || 0;
      pattern.transactionCount++;
    }
    
    // Calculate averages and trends
    for (const pattern of patterns.values()) {
      pattern.averageAmount = pattern.monthlyTotal / pattern.transactionCount;
      
      // Simple trend analysis (would be more sophisticated in production)
      const recentWeek = recentPurchases.filter(p => 
        p.category === pattern.category && 
        p.timestamp > now - (7 * 24 * 60 * 60 * 1000)
      );
      
      const recentWeekTotal = recentWeek.reduce((sum, p) => sum + (p.amount || 0), 0);
      const weeklyAverage = pattern.monthlyTotal / 4; // Rough monthly to weekly
      
      if (recentWeekTotal > weeklyAverage * 1.5) {
        pattern.trend = 'increasing';
      } else if (recentWeekTotal < weeklyAverage * 0.5) {
        pattern.trend = 'decreasing';
      }
    }
    
    return Array.from(patterns.values());
  }

  private static getMonthlySpendInCategory(purchases: any[], category: string): number {
    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    return purchases
      .filter(p => 
        p.category === category && 
        p.timestamp >= monthStart.getTime() &&
        p.proceeded // Only count completed purchases
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  /**
   * Get spending insights for the popup dashboard
   */
  static async getSpendingInsights(): Promise<{
    patterns: SpendingPattern[];
    totalMonthly: number;
    topCategory: string;
    savingsFromIntercepts: number;
  }> {
    const purchases = await this.getRecentPurchases();
    const patterns = this.analyzeSpendingPatterns(purchases);
    
    const totalMonthly = patterns.reduce((sum, p) => sum + p.monthlyTotal, 0);
    const topCategory = patterns.sort((a, b) => b.monthlyTotal - a.monthlyTotal)[0]?.category || 'None';
    
    // Calculate estimated savings from intercepts
    const interceptedPurchases = purchases.filter(p => p.intercepted && !p.proceeded);
    const savingsFromIntercepts = interceptedPurchases.reduce((sum, p) => sum + (p.amount || 50), 0);
    
    return {
      patterns,
      totalMonthly,
      topCategory,
      savingsFromIntercepts
    };
  }
}
