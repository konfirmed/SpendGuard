import React from 'react';
import { createRoot } from 'react-dom/client';
import CooldownTimer from '../components/CooldownTimer';
import { addPurchase, incrementIntercepts, getSettings } from '../utils/storage';

/**
 * Content script for intercepting checkout flows
 * Detects checkout pages and adds cooldown overlays
 */

interface CheckoutDetector {
  name: string;
  detect: () => boolean;
  getCheckoutButtons: () => NodeListOf<Element> | Element[];
}

// Common checkout page detectors
const CHECKOUT_DETECTORS: CheckoutDetector[] = [
  {
    name: 'Stripe',
    detect: () => document.querySelector('[data-testid="hosted-payment-submit-button"]') !== null ||
                  document.querySelector('.SubmitButton') !== null ||
                  window.location.href.includes('checkout.stripe.com'),
    getCheckoutButtons: () => document.querySelectorAll('[data-testid="hosted-payment-submit-button"], .SubmitButton')
  },
  {
    name: 'Shopify',
    detect: () => document.querySelector('[name="add"], .btn--checkout, #checkout_submit') !== null ||
                  window.location.href.includes('/checkout'),
    getCheckoutButtons: () => document.querySelectorAll('[name="add"], .btn--checkout, #checkout_submit, [data-testid="Checkout-button"]')
  },
  {
    name: 'Amazon',
    detect: () => document.querySelector('#buy-now-button, #add-to-cart-button, .a-button-oneclick') !== null ||
                  window.location.href.includes('amazon.com'),
    getCheckoutButtons: () => document.querySelectorAll('#buy-now-button, #add-to-cart-button, .a-button-oneclick, [name="submit.buy-now"]')
  },
  {
    name: 'PayPal',
    detect: () => document.querySelector('[data-funding-source="paypal"], .paypal-button') !== null ||
                  window.location.href.includes('paypal.com'),
    getCheckoutButtons: () => document.querySelectorAll('[data-funding-source="paypal"], .paypal-button, #payment-submit-btn')
  },
  {
    name: 'Generic',
    detect: () => true, // Always matches as fallback
    getCheckoutButtons: () => {
      const selectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.checkout-button',
        '.buy-button',
        '.purchase-button',
        '.order-button',
        '[data-testid*="checkout"]',
        '[data-testid*="buy"]',
        '[data-testid*="purchase"]'
      ];
      
      const buttons: Element[] = [];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('buy') || text.includes('purchase') || text.includes('checkout') || 
              text.includes('order') || text.includes('pay') || text.includes('complete')) {
            buttons.push(el);
          }
        });
      });
      
      return buttons;
    }
  }
];

class CheckoutInterceptor {
  private observer: MutationObserver | null = null;
  private interceptedListeners = new Map<Element, EventListener>();
  private cooldownContainer: HTMLElement | null = null;

  init() {
    this.startObserving();
    this.checkCurrentPage();
  }

  private startObserving() {
    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });
      
      if (shouldCheck) {
        this.debounce(() => this.checkCurrentPage(), 500)();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private async checkCurrentPage() {
    for (const detector of CHECKOUT_DETECTORS) {
      if (detector.detect()) {
        console.log(`WebAssistant: Detected ${detector.name} checkout page`);
        await this.interceptCheckoutButtons(detector);
        break;
      }
    }
  }

  private async interceptCheckoutButtons(detector: CheckoutDetector) {
    const buttons = detector.getCheckoutButtons();
    const settings = await getSettings();
    buttons.forEach((button) => {
      if (!this.interceptedListeners.has(button)) {
        this.addInterception(button as HTMLElement, settings);
      }
    });
  }

  private addInterception(button: HTMLElement, settings: { cooldownSeconds: number }) {
    // Create our interception listener and store it
    const interceptClick = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      await incrementIntercepts();
      await addPurchase({ url: window.location.href, timestamp: Date.now(), intercepted: true, proceeded: false });
      this.showCooldown(settings.cooldownSeconds, () => this.proceedWithOriginalAction(button), () => this.proceedWithOriginalAction(button));
    };
    this.interceptedListeners.set(button, interceptClick);
    button.addEventListener('click', interceptClick, true);
  }

  private proceedWithOriginalAction(button: HTMLElement) {
    // Log that user proceeded
    addPurchase({
      url: window.location.href,
      timestamp: Date.now(),
      intercepted: true,
      proceeded: true
    });
    // Remove our listener
    const listener = this.interceptedListeners.get(button);
    if (listener) {
      button.removeEventListener('click', listener, true);
      this.interceptedListeners.delete(button);
    }
    // Dispatch a native click event so default behavior and other handlers run
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    button.dispatchEvent(event);
  }

  private showCooldown(
    seconds: number,
    onComplete: () => void,
    onSkip: () => void
  ) {
    // Create container for React component
    this.cooldownContainer = document.createElement('div');
    this.cooldownContainer.id = 'webassistant-cooldown';
    this.cooldownContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      pointer-events: auto;
    `;
    
    document.body.appendChild(this.cooldownContainer);
    
    // Create shadow DOM to isolate styles
    const shadow = this.cooldownContainer.attachShadow({ mode: 'open' });
    const reactRoot = document.createElement('div');
    shadow.appendChild(reactRoot);
    
    // Add Tailwind styles to shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://cdn.tailwindcss.com');
      * { box-sizing: border-box; }
    `;
    shadow.appendChild(style);
    
    const root = createRoot(reactRoot);
    root.render(
      <CooldownTimer
        seconds={seconds}
        onComplete={() => {
          this.removeCooldown();
          onComplete();
        }}
        onSkip={() => {
          this.removeCooldown();
          onSkip();
        }}
      />
    );
  }

  private removeCooldown() {
    if (this.cooldownContainer) {
      this.cooldownContainer.remove();
      this.cooldownContainer = null;
    }
  }

  destroy() {
    // Remove all interception listeners
    this.interceptedListeners.forEach((listener, button) => {
      button.removeEventListener('click', listener, true);
    });
    this.interceptedListeners.clear();
    if (this.observer) this.observer.disconnect();
    this.removeCooldown();
  }
}

// Initialize the interceptor
const interceptor = new CheckoutInterceptor();
interceptor.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  interceptor.destroy();
});