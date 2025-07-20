/**
 * Enhanced Context Extraction for SpendGuard
 * Provides rich purchase context and spending insights
 */

interface EnhancedPurchaseContext {
  productName?: string;
  price?: number;
  priceText?: string;
  currency?: string;
  category?: string;
  vendor?: string;
  isSubscription?: boolean;
  discountDetected?: boolean;
  urgencySignals?: string[];
  similarPurchases?: number;
  monthlySpendInCategory?: number;
}

export class ContextAnalyzer {
  
  /**
   * Extract comprehensive purchase context from the current page
   */
  static extractContext(): EnhancedPurchaseContext {
    const context: EnhancedPurchaseContext = {};
    
    // Enhanced product name detection
    context.productName = this.extractProductName();
    
    // Enhanced price detection with currency
    const priceInfo = this.extractPriceInfo();
    context.price = priceInfo.amount;
    context.priceText = priceInfo.text;
    context.currency = priceInfo.currency;
    
    // Category detection
    context.category = this.detectCategory();
    
    // Vendor identification
    context.vendor = this.extractVendor();
    
    // Subscription detection
    context.isSubscription = this.detectSubscription();
    
    // Discount/urgency signals
    context.discountDetected = this.detectDiscount();
    context.urgencySignals = this.detectUrgencySignals();
    
    return context;
  }

  private static extractProductName(): string | undefined {
    const selectors = [
      'h1[data-testid*="product"]',
      '.product-title',
      '.product-name',
      '#productTitle',
      '[data-cy*="product-name"]',
      '.product-info h1',
      '.item-title',
      'h1.pdp-product-name', // Target specific
      '[data-automation-id*="product-title"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    // Fallback to page title if nothing found
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.toLowerCase().includes('cart') && !pageTitle.toLowerCase().includes('checkout')) {
      return pageTitle.split(' - ')[0].split(' | ')[0];
    }
    
    return undefined;
  }

  private static extractPriceInfo(): { amount?: number, text?: string, currency?: string } {
    const priceSelectors = [
      '.price-current',
      '.product-price',
      '.price',
      '[data-testid*="price"]',
      '.amount',
      '[data-price]',
      '.checkout-price',
      '.total-price',
      '.final-price'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        const text = element.textContent.trim();
        
        // Enhanced price parsing with currency detection
        const priceMatch = text.match(/([\$€£¥₹¢])\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|INR|CAD|AUD)/i);
        
        if (priceMatch) {
          const currency = priceMatch[1] || priceMatch[4] || '$';
          const amount = parseFloat((priceMatch[2] || priceMatch[3]).replace(/,/g, ''));
          
          return {
            amount,
            text,
            currency
          };
        }
      }
    }
    
    return {};
  }

  private static detectCategory(): string | undefined {
    // Category detection from breadcrumbs, navigation, or meta tags
    const categoryIndicators = [
      '.breadcrumb',
      '.category-nav',
      '[data-category]',
      '.department',
      'meta[property="product:category"]'
    ];
    
    for (const selector of categoryIndicators) {
      const element = document.querySelector(selector);
      if (element) {
        if (element.hasAttribute('content')) {
          return element.getAttribute('content') || undefined;
        }
        return element.textContent?.trim().split(' > ').pop();
      }
    }
    
    // URL-based category detection
    const urlPath = window.location.pathname.toLowerCase();
    const categoryKeywords = [
      'electronics', 'clothing', 'books', 'home', 'garden', 'sports',
      'beauty', 'health', 'toys', 'automotive', 'food', 'jewelry'
    ];
    
    for (const keyword of categoryKeywords) {
      if (urlPath.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    
    return undefined;
  }

  private static extractVendor(): string {
    const hostname = window.location.hostname;
    
    // Clean up common domain patterns
    return hostname
      .replace(/^www\./, '')
      .replace(/\.com$/, '')
      .replace(/\.co\..*$/, '')
      .split('.')[0]
      .charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  }

  private static detectSubscription(): boolean {
    const subscriptionIndicators = [
      'monthly', 'yearly', 'subscription', 'recurring', 'auto-renew',
      'per month', 'per year', '/month', '/year', 'subscribe'
    ];
    
    const pageText = document.body.textContent?.toLowerCase() || '';
    
    return subscriptionIndicators.some(indicator => 
      pageText.includes(indicator)
    );
  }

  private static detectDiscount(): boolean {
    const discountIndicators = [
      'sale', 'discount', 'off', 'deal', 'promo', 'coupon',
      'limited time', 'special offer', 'save', '%'
    ];
    
    const pageText = document.body.textContent?.toLowerCase() || '';
    
    return discountIndicators.some(indicator => 
      pageText.includes(indicator)
    );
  }

  private static detectUrgencySignals(): string[] {
    const urgencyPatterns = [
      'limited time',
      'only.*left',
      'hurry',
      'ends soon',
      'flash sale',
      'today only',
      'while supplies last',
      'going fast'
    ];
    
    const pageText = document.body.textContent?.toLowerCase() || '';
    const detectedSignals: string[] = [];
    
    for (const pattern of urgencyPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = pageText.match(regex);
      if (matches) {
        detectedSignals.push(...matches);
      }
    }
    
    return detectedSignals;
  }

  /**
   * Generate personalized nudge based on context
   */
  static generateContextualNudge(context: EnhancedPurchaseContext): string {
    const nudges: string[] = [];
    
    // Price-based nudges
    if (context.price) {
      if (context.price > 100) {
        nudges.push(`This $${context.price} purchase is significant. Have you compared prices elsewhere?`);
      }
      if (context.price < 20) {
        nudges.push("Small purchases add up. Is this really necessary right now?");
      }
    }
    
    // Subscription nudges
    if (context.isSubscription) {
      nudges.push("This appears to be a subscription. Remember, it will auto-renew unless cancelled.");
    }
    
    // Urgency signal nudges
    if (context.urgencySignals && context.urgencySignals.length > 0) {
      nudges.push("Sales pressure detected. Real deals don't disappear overnight. Take time to think.");
    }
    
    // Discount nudges
    if (context.discountDetected) {
      nudges.push("Discounts can create artificial urgency. Do you need this item at full price?");
    }
    
    // Category-specific nudges
    if (context.category) {
      const categoryNudges = {
        'Electronics': 'Tech purchases often have newer models coming soon. Research timing?',
        'Clothing': 'Consider if this fits your current style and if you have similar items.',
        'Books': 'Check if this is available at your library or as a free resource first.',
        'Home': 'Home items are long-term. Measure twice, buy once.',
      };
      
      const categoryNudge = categoryNudges[context.category as keyof typeof categoryNudges];
      if (categoryNudge) {
        nudges.push(categoryNudge);
      }
    }
    
    // Default nudge if no specific context
    if (nudges.length === 0) {
      nudges.push("Before you buy, ask yourself: Do I need this, or do I just want it?");
    }
    
    return nudges[Math.floor(Math.random() * nudges.length)];
  }
}
