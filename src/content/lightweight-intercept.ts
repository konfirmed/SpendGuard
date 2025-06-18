/**
 * Lightweight SpendGuard Content Script
 * No React, no Tailwind, minimal bundle size
 */

interface Settings {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
}

interface PurchaseContext {
  productName?: string;
  price?: number;
  priceText?: string;
  currency?: string;
  category?: string;
}

class LightweightInterceptor {
  private cooldownActive = false;
  private interceptedButtons = new Set<Element>();

  init() {
    this.scanForCheckoutButtons();
    this.observeChanges();
  }

  private observeChanges() {
    const observer = new MutationObserver(() => {
      if (!this.cooldownActive) {
        this.scanForCheckoutButtons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private scanForCheckoutButtons() {
    // Simplified but effective checkout button detection
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '.checkout-button',
      '.buy-button',
      '.purchase-button',
      '.add-to-cart',
      '.cart-button',
      '.proceed-button',
      '[data-testid*="checkout"]',
      '[data-testid*="buy"]',
      '[data-testid*="purchase"]',
      '[data-testid*="cart"]',
      // Platform-specific common selectors
      '.single_add_to_cart_button', // WooCommerce
      '#buy-now-button', // Amazon
      '.shopify-payment-button', // Shopify
      '.SubmitButton', // Stripe
      '.paypal-button' // PayPal
    ];

    const buttons = document.querySelectorAll(buttonSelectors.join(','));
    
    buttons.forEach(button => {
      if (!this.interceptedButtons.has(button) && this.isPurchaseButton(button)) {
        this.interceptedButtons.add(button);
        this.addInterception(button as HTMLElement);
      }
    });
  }

  private isPurchaseButton(element: Element): boolean {
    const text = (element.textContent || '').toLowerCase();
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const className = element.className.toLowerCase();
    
    const purchaseKeywords = [
      'buy', 'purchase', 'checkout', 'order', 'pay', 'complete',
      'add to cart', 'proceed', 'continue', 'place order', 'submit'
    ];
    
    const excludeKeywords = ['cancel', 'back', 'return', 'edit', 'remove'];
    
    const hasKeyword = purchaseKeywords.some(keyword => 
      text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword)
    );
    
    const hasExclude = excludeKeywords.some(keyword =>
      text.includes(keyword) || ariaLabel.includes(keyword)
    );
    
    return hasKeyword && !hasExclude;
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

  private showCooldown(seconds: number, onComplete: () => void) {
    this.cooldownActive = true;
    
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
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: #dbeafe;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem auto;
          ">
            <svg width="24" height="24" fill="#2563eb" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #111827;">
            Take a Moment
          </h2>
          
          <p style="margin: 0 0 1.5rem 0; color: #6b7280; line-height: 1.5;">
            Before completing this purchase, let's pause and reflect. Is this something you really need right now?
          </p>
          
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
    
    // Remove our interception
    this.interceptedButtons.delete(button);
    
    // Dispatch native click
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    button.dispatchEvent(event);
  }

  private async getSettings(): Promise<Settings> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, response => {
        resolve(response?.settings || {
          cooldownSeconds: 30,
          enableNudges: true,
          enableScamDetection: true
        });
      });
    });
  }

  private async recordIntercept(context: PurchaseContext) {
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
  }

  private recordProceed() {
    chrome.runtime.sendMessage({
      action: 'addPurchase',
      purchase: {
        url: window.location.href,
        timestamp: Date.now(),
        intercepted: true,
        proceeded: true
      }
    });
  }
}

// Initialize the lightweight interceptor
const interceptor = new LightweightInterceptor();
interceptor.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Lightweight cleanup - no complex teardown needed
});
