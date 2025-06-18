import React from 'react';
import { createRoot } from 'react-dom/client';
import CooldownTimer from '../components/CooldownTimer';
import { addPurchase, incrementIntercepts, getSettings } from '../utils/messaging';
import { extractPurchaseContext, analyzePriceLevel } from '../utils/priceAnalysis';

/**
 * Content script for intercepting checkout flows
 * Detects checkout pages and adds cooldown overlays
 */

interface CheckoutDetector {
  name: string;
  detect: () => boolean;
  getCheckoutButtons: () => NodeListOf<Element> | Element[];
}

// Enhanced checkout page detectors with more platforms
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
                  window.location.href.includes('/checkout') ||
                  document.querySelector('.shopify-payment-button') !== null,
    getCheckoutButtons: () => document.querySelectorAll('[name="add"], .btn--checkout, #checkout_submit, [data-testid="Checkout-button"], .shopify-payment-button')
  },
  {
    name: 'Amazon',
    detect: () => document.querySelector('#buy-now-button, #add-to-cart-button, .a-button-oneclick') !== null ||
                  window.location.href.includes('amazon.com'),
    getCheckoutButtons: () => document.querySelectorAll('#buy-now-button, #add-to-cart-button, .a-button-oneclick, [name="submit.buy-now"], #attach-sims-purchase-button')
  },
  {
    name: 'WooCommerce',
    detect: () => document.querySelector('.woocommerce-checkout, .single_add_to_cart_button, .checkout-button') !== null ||
                  document.body.classList.contains('woocommerce'),
    getCheckoutButtons: () => document.querySelectorAll('.single_add_to_cart_button, .checkout-button, .wc-proceed-to-checkout, #place_order')
  },
  {
    name: 'Magento',
    detect: () => document.querySelector('#product-addtocart-button, .btn-cart, .action.primary.checkout') !== null ||
                  window.location.href.includes('/checkout'),
    getCheckoutButtons: () => document.querySelectorAll('#product-addtocart-button, .btn-cart, .action.primary.checkout')
  },
  {
    name: 'BigCommerce',
    detect: () => document.querySelector('[data-button-type="add-cart"], .button--primary.add-to-cart') !== null,
    getCheckoutButtons: () => document.querySelectorAll('[data-button-type="add-cart"], .button--primary.add-to-cart, .checkout-button')
  },
  {
    name: 'Squarespace',
    detect: () => document.querySelector('.sqs-add-to-cart-button, .checkout-button') !== null ||
                  window.location.href.includes('squarespace.com'),
    getCheckoutButtons: () => document.querySelectorAll('.sqs-add-to-cart-button, .checkout-button, .continue-button')
  },
  {
    name: 'Etsy',
    detect: () => document.querySelector('[data-test-id="add-to-cart-button"], .btn-cart') !== null ||
                  window.location.href.includes('etsy.com'),
    getCheckoutButtons: () => document.querySelectorAll('[data-test-id="add-to-cart-button"], .btn-cart, .proceed-to-checkout')
  },
  {
    name: 'eBay',
    detect: () => document.querySelector('#binBtn_btn, #buyItNowBtn, .notranslate') !== null ||
                  window.location.href.includes('ebay.com'),
    getCheckoutButtons: () => document.querySelectorAll('#binBtn_btn, #buyItNowBtn, .notranslate[id*="buy"]')
  },
  {
    name: 'PayPal',
    detect: () => document.querySelector('[data-funding-source="paypal"], .paypal-button') !== null ||
                  window.location.href.includes('paypal.com'),
    getCheckoutButtons: () => document.querySelectorAll('[data-funding-source="paypal"], .paypal-button, #payment-submit-btn, .continueButton')
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
        '.add-to-cart',
        '.cart-button',
        '[data-testid*="checkout"]',
        '[data-testid*="buy"]',
        '[data-testid*="purchase"]',
        '[data-testid*="cart"]'
      ];
      
      const buttons: Element[] = [];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent?.toLowerCase() || '';
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
          const title = el.getAttribute('title')?.toLowerCase() || '';
          
          const purchaseKeywords = ['buy', 'purchase', 'checkout', 'order', 'pay', 'complete', 'add to cart', 'proceed'];
          const hasKeyword = purchaseKeywords.some(keyword => 
            text.includes(keyword) || ariaLabel.includes(keyword) || title.includes(keyword)
          );
          
          if (hasKeyword) {
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
        console.log(`SpendGuard: Detected ${detector.name} checkout page`);
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
      
      // Extract purchase context for enhanced analysis
      const purchaseContext = extractPurchaseContext();
      
      await incrementIntercepts();
      await addPurchase({ 
        url: window.location.href, 
        timestamp: Date.now(), 
        intercepted: true, 
        proceeded: false,
        amount: purchaseContext.price || undefined
      });
      
      // Determine price level for better UI feedback
      let priceLevel: 'low' | 'medium' | 'high' | 'very-high' | undefined;
      if (purchaseContext.price && purchaseContext.category) {
        priceLevel = analyzePriceLevel(purchaseContext.price, purchaseContext.category);
      }

      this.showCooldown(
        settings.cooldownSeconds, 
        () => this.proceedWithOriginalAction(button), 
        () => this.proceedWithOriginalAction(button),
        {
          ...purchaseContext,
          priceLevel
        }
      );
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
    onSkip: () => void,
    purchaseContext?: any
  ) {
    // Create container for React component
    this.cooldownContainer = document.createElement('div');
    this.cooldownContainer.id = 'spendguard-cooldown';
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
    
    // Add inline CSS to shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      /* Essential Tailwind styles for SpendGuard cooldown timer */
      *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
      .fixed { position: fixed; }
      .inset-0 { top: 0px; right: 0px; bottom: 0px; left: 0px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-between { justify-content: space-between; }
      .p-4 { padding: 1rem; }
      .p-8 { padding: 2rem; }
      .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-4 { margin-bottom: 1rem; }
      .ml-1 { margin-left: 0.25rem; }
      .mr-2 { margin-right: 0.5rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .w-full { width: 100%; }
      .w-8 { width: 2rem; }
      .w-16 { width: 4rem; }
      .h-3 { height: 0.75rem; }
      .h-8 { height: 2rem; }
      .h-16 { height: 4rem; }
      .max-w-md { max-width: 28rem; }
      .bg-white { background-color: rgb(255 255 255); }
      .bg-black { background-color: rgb(0 0 0); }
      .bg-gray-50 { background-color: rgb(249 250 251); }
      .bg-gray-200 { background-color: rgb(229 231 235); }
      .bg-blue-50 { background-color: rgb(239 246 255); }
      .bg-blue-100 { background-color: rgb(219 234 254); }
      .bg-blue-600 { background-color: rgb(37 99 235); }
      .bg-green-600 { background-color: rgb(22 163 74); }
      .bg-green-700 { background-color: rgb(21 128 61); }
      .bg-gray-300 { background-color: rgb(209 213 219); }
      .bg-opacity-75 { background-color: rgb(0 0 0 / 0.75); }
      .text-white { color: rgb(255 255 255); }
      .text-gray-400 { color: rgb(156 163 175); }
      .text-gray-600 { color: rgb(75 85 99); }
      .text-gray-700 { color: rgb(55 65 81); }
      .text-gray-900 { color: rgb(17 24 39); }
      .text-blue-600 { color: rgb(37 99 235); }
      .text-blue-700 { color: rgb(29 78 216); }
      .text-green-600 { color: rgb(22 163 74); }
      .text-orange-600 { color: rgb(234 88 12); }
      .text-red-600 { color: rgb(220 38 38); }
      .text-yellow-600 { color: rgb(202 138 4); }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .text-6xl { font-size: 3.75rem; line-height: 1; }
      .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .font-medium { font-weight: 500; }
      .font-bold { font-weight: 700; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace; }
      .capitalize { text-transform: capitalize; }
      .rounded-full { border-radius: 9999px; }
      .rounded-lg { border-radius: 0.5rem; }
      .border { border-width: 1px; }
      .border-blue-200 { border-color: rgb(191 219 254); }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
      .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
      .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
      .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
      .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
      .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .overflow-hidden { overflow: hidden; }
      .transform { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
      .scale-100 { --tw-scale-x: 1; --tw-scale-y: 1; }
      .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .duration-300 { transition-duration: 300ms; }
      .duration-1000 { transition-duration: 1000ms; }
      .ease-linear { transition-timing-function: linear; }
      .z-50 { z-index: 50; }
      button { cursor: pointer; }
      button:focus { outline: 2px solid transparent; outline-offset: 2px; }
      .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
      .focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
      .focus\\:ring-gray-400:focus { --tw-ring-color: rgb(156 163 175); }
      .focus\\:ring-green-500:focus { --tw-ring-color: rgb(34 197 94); }
      .hover\\:bg-gray-300:hover { background-color: rgb(209 213 219); }
      .hover\\:bg-green-700:hover { background-color: rgb(21 128 61); }
    `;
    shadow.appendChild(style);
    
    const root = createRoot(reactRoot);
    root.render(
      <CooldownTimer
        seconds={seconds}
        purchaseContext={purchaseContext}
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