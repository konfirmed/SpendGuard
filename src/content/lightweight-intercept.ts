/**
 * Lightweight SpendGuard Content Script
 * No React, no Tailwind, minimal bundle size
 */

import type { Settings, PurchaseContext, SavingsData } from '../types/shared';

class LightweightInterceptor {
  private cooldownActive = false;
  private interceptedButtons = new Set<Element>();
  private eventListeners = new Map<Element, EventListener>();
  private observer: MutationObserver | null = null;
  private processedButtons = new WeakSet<Element>();

  init() {
    this.scanForCheckoutButtons();
    this.observeChanges();
    this.setupSavingsDisplay();
  }

  private observeChanges() {
    this.observer = new MutationObserver(() => {
      if (!this.cooldownActive) {
        this.scanForCheckoutButtons();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private scanForCheckoutButtons() {
    // Skip scanning on excluded sites
    if (this.isExcludedSite()) {
      return;
    }
    
    // More targeted checkout button detection
    const buttonSelectors = [
      // E-commerce specific selectors
      '.checkout-button',
      '.buy-button', 
      '.purchase-button',
      '.add-to-cart',
      '.cart-button',
      '.proceed-button',
      '[data-testid*="checkout"]',
      '[data-testid*="buy"]',
      '[data-testid*="purchase"]',
      '[data-testid*="add-to-cart"]',
      // Platform-specific selectors
      '.single_add_to_cart_button', // WooCommerce
      '#buy-now-button', // Amazon
      '.shopify-payment-button', // Shopify
      '.SubmitButton', // Stripe
      '.paypal-button', // PayPal
      // Generic but filtered selectors
      'button[type="submit"]',
      'input[type="submit"]'
    ];

    const buttons = document.querySelectorAll(buttonSelectors.join(','));
    
    buttons.forEach(button => {
      if (!this.interceptedButtons.has(button) && !this.processedButtons.has(button) && this.isPurchaseButton(button)) {
        this.interceptedButtons.add(button);
        this.processedButtons.add(button);
        this.addInterception(button as HTMLElement);
      }
    });
  }

  private isPurchaseButton(element: Element): boolean {
    // Skip if we're on GitHub, GitLab, or other development platforms
    if (this.isExcludedSite()) {
      return false;
    }
    
    const text = (element.textContent || '').toLowerCase();
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    const purchaseKeywords = [
      'buy', 'purchase', 'checkout', 'order', 'pay', 'complete',
      'add to cart', 'proceed', 'continue', 'place order', 'submit order'
    ];
    
    const excludeKeywords = [
      'cancel', 'back', 'return', 'edit', 'remove', 'delete',
      'merge', 'commit', 'push', 'pull', 'fork', 'clone',
      'create', 'new', 'save', 'update', 'submit pull', 'submit issue'
    ];
    
    const hasKeyword = purchaseKeywords.some(keyword => 
      text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword)
    );
    
    const hasExclude = excludeKeywords.some(keyword =>
      text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword) || id.includes(keyword)
    );
    
    // Additional check: must be on a likely e-commerce domain or page
    const isLikelyEcommerce = this.isLikelyEcommercePage();
    
    return hasKeyword && !hasExclude && isLikelyEcommerce;
  }

  private isExcludedSite(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    const excludedDomains = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'stackexchange.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'google.com',
      'microsoft.com',
      'apple.com',
      'developer.mozilla.org',
      'docs.google.com',
      'notion.so',
      'slack.com',
      'discord.com',
      'zoom.us'
    ];
    
    return excludedDomains.some(domain => hostname.includes(domain));
  }

  private isLikelyEcommercePage(): boolean {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Known e-commerce indicators
    const ecommerceIndicators = [
      '/checkout', '/cart', '/buy', '/purchase', '/order', '/payment',
      'shop', 'store', 'market', 'commerce', 'retail'
    ];
    
    const hasEcommerceIndicator = ecommerceIndicators.some(indicator =>
      url.includes(indicator) || hostname.includes(indicator)
    );
    
    // Check for price elements on page (strong indicator of e-commerce)
    const hasPriceElements = document.querySelector('.price, .product-price, .amount, [data-price]') !== null;
    
    // Check for shopping cart elements
    const hasCartElements = document.querySelector('.cart, .shopping-cart, .basket') !== null;
    
    return hasEcommerceIndicator || hasPriceElements || hasCartElements;
  }

  private addInterception(button: HTMLElement) {
    const interceptClick = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const settings = await this.getSettings();
      const context = this.extractSimpleContext();
      
      await this.recordIntercept(context);
      
      this.showCooldown(settings.cooldownSeconds, () => {
        this.proceedWithClick(button);
      });
    };

    // Store the event listener reference for proper cleanup
    this.eventListeners.set(button, interceptClick);
    button.addEventListener('click', interceptClick, true);
  }

  private extractSimpleContext(): PurchaseContext {
    // Simplified context extraction
    const context: PurchaseContext = {};
    
    // Try to find product name
    const titleSelectors = ['h1', '.product-title', '.product-name', '#productTitle'];
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        context.productName = element.textContent.trim();
        break;
      }
    }
    
    // Try to find price
    const priceSelectors = ['.price', '.product-price', '.amount', '[data-price]'];
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        const priceMatch = element.textContent.match(/[\$€£¥]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          context.priceText = element.textContent.trim();
          context.price = parseFloat(priceMatch[1].replace(/,/g, ''));
          break;
        }
      }
    }
    
    return context;
  }

  private extractEnhancedContext(): PurchaseContext {
    const context = this.extractSimpleContext();
    
    // Add category detection
    const categorySelectors = ['.breadcrumb', '.category-nav', '[data-category]'];
    for (const selector of categorySelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        context.category = element.textContent.trim().split(' > ').pop();
        break;
      }
    }
    
    // URL-based category fallback
    if (!context.category) {
      const urlPath = window.location.pathname.toLowerCase();
      const categoryKeywords = [
        'electronics', 'clothing', 'books', 'home', 'garden', 'sports',
        'beauty', 'health', 'toys', 'automotive', 'food', 'jewelry'
      ];
      
      for (const keyword of categoryKeywords) {
        if (urlPath.includes(keyword)) {
          context.category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
    }
    
    return context;
  }

  private async getPersonalizedNudge(context: PurchaseContext): Promise<string> {
    // Try to get AI-generated nudge
    try {
      // Import the gptClient utility
      const { getGPTNudge } = await import('../utils/gptClient');
      
      // Convert to string format for compatibility
      const contextString = `Product: ${context.productName || 'Unknown'}, Price: ${context.priceText || 'Unknown'}, Category: ${context.category || 'Unknown'}, URL: ${window.location.href}`;
      
      return await getGPTNudge(contextString);
    } catch (error) {
      console.warn('SpendGuard: Failed to get AI nudge, using fallback', error);
      
      // Fallback to context-aware static nudges
      if (context.price && context.price > 100) {
        return `This $${context.price} purchase is significant. Have you compared prices elsewhere?`;
      }
      
      if (context.category === 'Electronics') {
        return 'Tech purchases often have newer models coming soon. Research timing?';
      }
      
      if (context.productName) {
        return `Before buying "${context.productName}", ask yourself: Do I need this, or do I just want it?`;
      }
      
      return 'Before completing this purchase, let\'s pause and reflect. Is this something you really need right now?';
    }
  }

  private async analyzeSpendingContext(context: PurchaseContext, settings: Settings): Promise<any> {
    try {
      // Import the spending analytics utility
      const { SpendingAnalytics } = await import('../utils/spending-analytics');
      return await SpendingAnalytics.analyzeCurrentPurchase(context, settings);
    } catch (error) {
      console.warn('SpendGuard: Failed to analyze spending context, using defaults', error);
      
      // Fallback to basic analysis
      return {
        shouldIncreaseDelay: false,
        customMessage: 'Take a moment to consider this purchase.',
        insights: []
      };
    }
  }

  private async showCooldown(seconds: number, onComplete: () => void) {
    this.cooldownActive = true;
    
    // Get enhanced context for personalized messaging
    const context = this.extractEnhancedContext();
    const settings = await this.getSettings();
    
    // Generate personalized nudge
    const personalizedMessage = await this.getPersonalizedNudge(context);
    
    // Check spending analytics for custom warnings
    const analytics = await this.analyzeSpendingContext(context, settings);
    
    const overlay = document.createElement('div');
    overlay.id = 'spendguard-cooldown-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 420px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: ${analytics.shouldIncreaseDelay ? '#fecaca' : '#dbeafe'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem auto;
          ">
            <svg width="24" height="24" fill="${analytics.shouldIncreaseDelay ? '#dc2626' : '#2563eb'}" viewBox="0 0 24 24">
              ${analytics.shouldIncreaseDelay 
                ? '<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
                : '<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
              }
            </svg>
          </div>
          
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #111827;">
            ${analytics.shouldIncreaseDelay ? 'Hold On!' : 'Take a Moment'}
          </h2>
          
          <p style="margin: 0 0 1.5rem 0; color: #6b7280; line-height: 1.5;">
            ${personalizedMessage}
          </p>
          
          ${analytics.budgetAlert ? `
            <div style="
              background: ${analytics.budgetAlert.type === 'danger' ? '#fef2f2' : '#fff3cd'};
              border: 1px solid ${analytics.budgetAlert.type === 'danger' ? '#fecaca' : '#ffeaa7'};
              border-radius: 8px;
              padding: 0.75rem;
              margin-bottom: 1rem;
              font-size: 0.875rem;
              color: ${analytics.budgetAlert.type === 'danger' ? '#dc2626' : '#d97706'};
            ">
              💰 ${analytics.budgetAlert.message}
            </div>
          ` : ''}
          
          ${context.productName ? `
            <div style="
              background: #f8fafc;
              border-radius: 8px;
              padding: 0.75rem;
              margin-bottom: 1.5rem;
              text-align: left;
            ">
              <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Item:</div>
              <div style="font-weight: 600; color: #1e293b;">${context.productName}</div>
              ${context.priceText ? `<div style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">${context.priceText}</div>` : ''}
            </div>
          ` : ''}
          
          <div style="margin-bottom: 1.5rem;">
            <div id="countdown" style="
              font-size: 3rem;
              font-weight: 700;
              color: #2563eb;
              font-family: ui-monospace, SFMono-Regular, monospace;
              margin-bottom: 0.75rem;
            ">${seconds}</div>
            
            <div style="
              width: 100%;
              height: 8px;
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div id="progress-bar" style="
                height: 100%;
                background: #2563eb;
                width: 0%;
                transition: width 1s linear;
                border-radius: 4px;
              "></div>
            </div>
          </div>
          
          <div style="
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            text-align: left;
          ">
            <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151; font-size: 0.875rem;">
              Consider:
            </p>
            <ul style="margin: 0; padding-left: 1rem; color: #6b7280; font-size: 0.875rem; line-height: 1.4;">
              <li>Do I have a specific need for this item?</li>
              <li>Can I wait 24 hours to decide?</li>
              <li>Is this within my budget?</li>
              <li>Have I compared alternatives?</li>
            </ul>
          </div>
          
          <div style="display: flex; gap: 0.75rem; flex-direction: column;">
            <button id="skip-btn" style="
              background: #d1d5db;
              color: #374151;
              border: none;
              padding: 0.75rem 1rem;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s;
              display: none;
            ">
              Proceed Anyway
            </button>
            
            <button id="wait-btn" style="
              background: #059669;
              color: white;
              border: none;
              padding: 0.75rem 1rem;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              Take More Time to Decide
            </button>
          </div>
          
          <p style="margin: 1rem 0 0 0; color: #9ca3af; font-size: 0.75rem;">
            This pause is brought to you by SpendGuard
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const countdownEl = overlay.querySelector('#countdown')!;
    const progressEl = overlay.querySelector('#progress-bar') as HTMLElement;
    const skipBtn = overlay.querySelector('#skip-btn') as HTMLElement;
    const waitBtn = overlay.querySelector('#wait-btn')!;
    
    let remaining = seconds;
    let canSkip = false;
    
    // Allow skipping after 5 seconds
    setTimeout(() => {
      canSkip = true;
      skipBtn.style.display = 'block';
    }, Math.min(5000, seconds * 1000));
    
    const timer = setInterval(() => {
      remaining--;
      countdownEl.textContent = this.formatTime(remaining);
      
      const progress = ((seconds - remaining) / seconds) * 100;
      progressEl.style.width = `${progress}%`;
      
      if (remaining <= 0) {
        clearInterval(timer);
        skipBtn.textContent = 'Continue Purchase';
        skipBtn.style.background = '#059669';
        skipBtn.style.color = 'white';
      }
    }, 1000);
    
    skipBtn.addEventListener('click', () => {
      if (remaining <= 0 || canSkip) {
        this.removeCooldown(overlay);
        onComplete();
      }
    });
    
    waitBtn.addEventListener('click', () => {
      this.removeCooldown(overlay);
    });
    
    // Add hover effects
    skipBtn.addEventListener('mouseenter', () => {
      if (remaining <= 0) {
        (skipBtn as HTMLElement).style.background = '#047857';
      } else {
        (skipBtn as HTMLElement).style.background = '#9ca3af';
      }
    });
    
    skipBtn.addEventListener('mouseleave', () => {
      if (remaining <= 0) {
        (skipBtn as HTMLElement).style.background = '#059669';
      } else {
        (skipBtn as HTMLElement).style.background = '#d1d5db';
      }
    });
    
    waitBtn.addEventListener('mouseenter', () => {
      (waitBtn as HTMLElement).style.background = '#047857';
    });
    
    waitBtn.addEventListener('mouseleave', () => {
      (waitBtn as HTMLElement).style.background = '#059669';
    });
  }

  private formatTime(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs.toString();
  }

  private removeCooldown(overlay: HTMLElement) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      overlay.remove();
      this.cooldownActive = false;
    }, 300);
  }

  private proceedWithClick(button: HTMLElement) {
    this.recordProceed();
    
    // Remove our interception properly
    this.interceptedButtons.delete(button);
    this.processedButtons.add(button); // Mark as processed to prevent re-interception
    
    // Remove the event listener to prevent further blocking
    const listener = this.eventListeners.get(button);
    if (listener) {
      button.removeEventListener('click', listener, true);
      this.eventListeners.delete(button);
    }
    
    // Try multiple event types for better compatibility
    const eventTypes = ['pointerdown', 'mousedown', 'mouseup', 'click'];
    eventTypes.forEach(type => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      button.dispatchEvent(event);
    });
    
    // Fallback: try to trigger form submission if button is in a form
    const form = button.closest('form');
    if (form && (button as HTMLButtonElement).type === 'submit') {
      setTimeout(() => {
        try {
          form.submit();
        } catch (error) {
          console.warn('SpendGuard: Could not submit form', error);
        }
      }, 100);
    }
  }

  private async getSettings(): Promise<Settings> {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response: any) => {
          if (chrome.runtime.lastError) {
            console.warn('SpendGuard: Error getting settings:', chrome.runtime.lastError);
            resolve({
              cooldownSeconds: 30,
              enableNudges: true,
              enableScamDetection: true
            });
            return;
          }
          resolve(response?.settings || {
            cooldownSeconds: 30,
            enableNudges: true,
            enableScamDetection: true
          });
        });
      } catch (error) {
        console.warn('SpendGuard: Failed to get settings:', error);
        resolve({
          cooldownSeconds: 30,
          enableNudges: true,
          enableScamDetection: true
        });
      }
    });
  }

  private async recordIntercept(context: PurchaseContext) {
    try {
      // Record the intercept for analytics
      chrome.runtime.sendMessage({
        action: 'addPurchase',
        purchase: {
          url: window.location.href,
          timestamp: Date.now(),
          intercepted: true,
          proceeded: false,
          amount: context.price
        }
      });

      chrome.runtime.sendMessage({
        action: 'incrementIntercepts'
      });

      // Track savings if we have a price
      if (context.price) {
        await this.recordSavings(context);
      }
    } catch (error) {
      console.warn('SpendGuard: Failed to record intercept:', error);
    }
  }

  private recordProceed() {
    try {
      chrome.runtime.sendMessage({
        action: 'addPurchase',
        purchase: {
          url: window.location.href,
          timestamp: Date.now(),
          intercepted: true,
          proceeded: true
        }
      });
    } catch (error) {
      console.warn('SpendGuard: Failed to record proceed:', error);
    }
  }

  // 💰 SAVINGS TRACKING SYSTEM
  private async recordSavings(context: PurchaseContext) {
    if (!context.price) return;

    const savingsData = await this.getSavingsData();
    const now = Date.now();
    const monthKey = new Date(now).toISOString().slice(0, 7); // YYYY-MM

    // Update savings data
    savingsData.totalSaved += context.price;
    savingsData.interceptsCount += 1;
    savingsData.lastInterceptDate = now;

    // Track category savings
    if (context.category) {
      savingsData.categorySavings[context.category] = 
        (savingsData.categorySavings[context.category] || 0) + context.price;
    }

    // Track monthly savings
    savingsData.monthlySavings[monthKey] = 
      (savingsData.monthlySavings[monthKey] || 0) + context.price;

    // Track biggest save
    if (context.price > savingsData.biggestSave.amount) {
      savingsData.biggestSave = {
        amount: context.price,
        productName: context.productName,
        date: now
      };
    }

    // Save to storage
    await this.saveSavingsData(savingsData);

    // Show savings notification
    this.showSavingsNotification(context.price, savingsData.totalSaved);
  }

  private async getSavingsData(): Promise<SavingsData> {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(['spendguardSavings'], (result: any) => {
          if (chrome.runtime.lastError) {
            console.warn('SpendGuard: Error getting savings data:', chrome.runtime.lastError);
            resolve(this.getDefaultSavingsData());
            return;
          }
          resolve(result.spendguardSavings || this.getDefaultSavingsData());
        });
      } catch (error) {
        console.warn('SpendGuard: Failed to get savings data:', error);
        resolve(this.getDefaultSavingsData());
      }
    });
  }

  private async saveSavingsData(data: SavingsData): Promise<void> {
    return new Promise(resolve => {
      try {
        chrome.storage.local.set({ spendguardSavings: data }, () => {
          if (chrome.runtime.lastError) {
            console.warn('SpendGuard: Error saving savings data:', chrome.runtime.lastError);
          }
          resolve();
        });
      } catch (error) {
        console.warn('SpendGuard: Failed to save savings data:', error);
        resolve();
      }
    });
  }

  private getDefaultSavingsData(): SavingsData {
    return {
      totalSaved: 0,
      interceptsCount: 0,
      proceededCount: 0,
      lastInterceptDate: 0,
      categorySavings: {},
      monthlySavings: {},
      biggestSave: {
        amount: 0,
        date: 0
      }
    };
  }

  private showSavingsNotification(amountSaved: number, totalSaved: number) {
    // Create a subtle notification showing the savings
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.875rem;
      max-width: 300px;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          💰
        </div>
        <div>
          <div style="font-weight: 600;">Saved $${amountSaved.toFixed(2)}!</div>
          <div style="opacity: 0.9; font-size: 0.75rem;">Total saved: $${totalSaved.toFixed(2)}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  private async setupSavingsDisplay() {
    // Only show on certain pages to avoid clutter
    if (!this.shouldShowSavingsDisplay()) return;

    const savingsData = await this.getSavingsData();
    if (savingsData.totalSaved <= 0) return;

    this.createSavingsWidget(savingsData);
  }

  private shouldShowSavingsDisplay(): boolean {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Show on cart, checkout, or product pages
    const showOnPages = [
      '/cart', '/checkout', '/buy', '/purchase', '/product',
      'shop', 'store'
    ];
    
    return showOnPages.some(page => url.includes(page) || hostname.includes(page));
  }

  private createSavingsWidget(savingsData: SavingsData) {
    // Don't create if already exists
    if (document.getElementById('spendguard-savings-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'spendguard-savings-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: white;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 999997;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.875rem;
      max-width: 280px;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyAmount = savingsData.monthlySavings[thisMonth] || 0;

    widget.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
        ">
          💰
        </div>
        <div>
          <div style="font-weight: 700; color: #065f46; font-size: 1rem;">
            $${savingsData.totalSaved.toFixed(2)} Saved
          </div>
          <div style="color: #6b7280; font-size: 0.75rem;">
            ${savingsData.interceptsCount} purchases prevented
          </div>
          ${monthlyAmount > 0 ? `
            <div style="color: #059669; font-size: 0.75rem; font-weight: 500;">
              $${monthlyAmount.toFixed(2)} this month
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Add hover effect
    widget.addEventListener('mouseenter', () => {
      widget.style.transform = 'scale(1.05)';
    });

    widget.addEventListener('mouseleave', () => {
      widget.style.transform = 'scale(1)';
    });

    // Click to show detailed savings
    widget.addEventListener('click', () => {
      this.showDetailedSavings(savingsData);
    });

    document.body.appendChild(widget);
  }

  private showDetailedSavings(savingsData: SavingsData) {
    // Remove existing modal if present
    const existing = document.getElementById('spendguard-savings-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'spendguard-savings-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const monthlyData = Object.entries(savingsData.monthlySavings)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);

    const categoryData = Object.entries(savingsData.categorySavings)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #065f46;">
            💰 Your Savings Report
          </h2>
          <button id="close-savings" style="
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0.25rem;
          ">×</button>
        </div>

        <div style="
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          margin-bottom: 1.5rem;
        ">
          <div style="font-size: 2.5rem; font-weight: 800; color: #065f46; margin-bottom: 0.5rem;">
            $${savingsData.totalSaved.toFixed(2)}
          </div>
          <div style="color: #059669; font-weight: 600;">Total Money Saved</div>
          <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            From ${savingsData.interceptsCount} prevented purchases
          </div>
        </div>

        ${savingsData.biggestSave.amount > 0 ? `
          <div style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
          ">
            <div style="font-weight: 600; color: #9a3412; margin-bottom: 0.25rem;">
              🏆 Biggest Save
            </div>
            <div style="color: #ea580c; font-weight: 700;">
              $${savingsData.biggestSave.amount.toFixed(2)}
            </div>
            ${savingsData.biggestSave.productName ? `
              <div style="color: #7c2d12; font-size: 0.875rem;">
                ${savingsData.biggestSave.productName}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${monthlyData.length > 0 ? `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: #374151;">
              📅 Monthly Breakdown
            </h3>
            ${monthlyData.map(([month, amount]) => `
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f3f4f6;
              ">
                <span style="color: #6b7280;">${new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <span style="font-weight: 600; color: #059669;">$${amount.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${categoryData.length > 0 ? `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: #374151;">
              🏷️ Savings by Category
            </h3>
            ${categoryData.map(([category, amount]) => `
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f3f4f6;
              ">
                <span style="color: #6b7280;">${category}</span>
                <span style="font-weight: 600; color: #059669;">$${amount.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        ">
          <div style="color: #64748b; font-size: 0.875rem; line-height: 1.4;">
            🎯 <strong>Keep it up!</strong> Every prevented purchase is money in your pocket.
            <br>SpendGuard is helping you build better spending habits.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeBtn = modal.querySelector('#close-savings');
    closeBtn?.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}

// Initialize the lightweight interceptor
const interceptor = new LightweightInterceptor();
interceptor.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Clean up event listeners and observers
  if (interceptor) {
    // Remove all event listeners
    for (const [button, listener] of (interceptor as any).eventListeners) {
      button.removeEventListener('click', listener, true);
    }
    
    // Disconnect observer
    if ((interceptor as any).observer) {
      (interceptor as any).observer.disconnect();
    }

    // Remove any UI elements
    const overlay = document.getElementById('spendguard-cooldown-overlay');
    if (overlay) overlay.remove();
    
    const widget = document.getElementById('spendguard-savings-widget');
    if (widget) widget.remove();
    
    const modal = document.getElementById('spendguard-savings-modal');
    if (modal) modal.remove();
  }
});
