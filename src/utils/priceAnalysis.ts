/**
 * Price extraction and purchase context detection utilities
 * Phase 2 Enhanced Intelligence features for SpendGuard
 */

export interface PurchaseContext {
  url: string;
  pageTitle: string;
  productName?: string;
  price?: number;
  priceText?: string;
  category?: string;
  platform?: string;
  currency?: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Extract price information from the current page
 */
export function extractPrice(): { price: number | null; priceText: string | null; currency: string | null } {
  const priceSelectors = [
    // Common price selectors
    '.price', '.product-price', '.current-price', '.sale-price', '.final-price',
    '[data-testid*="price"]', '[data-price]', '.price-current', '.price-now',
    '.amount', '.cost', '.total', '.subtotal',
    
    // Platform-specific selectors
    '.a-price-whole', '.a-price .a-offscreen', // Amazon
    '.money', '.price-item--regular', // Shopify
    '.notranslate', '.u-flL.condense', // eBay
    '.currency-value', '.price-display', // Etsy
    '.sqs-money-native', // Squarespace
    
    // Generic patterns
    '[class*="price"]', '[id*="price"]', '[class*="cost"]', '[id*="cost"]'
  ];

  let bestPrice: number | null = null;
  let bestPriceText: string | null = null;
  let currency: string | null = null;

  for (const selector of priceSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.textContent?.trim() || '';
        const priceMatch = extractPriceFromText(text);
        
        if (priceMatch.price !== null) {
          // Prefer higher prices (likely the main product price vs discounted price)
          if (bestPrice === null || priceMatch.price > bestPrice) {
            bestPrice = priceMatch.price;
            bestPriceText = text;
            currency = priceMatch.currency;
          }
        }
      }
    } catch (error) {
      console.warn('SpendGuard: Error extracting price from selector:', selector, error);
    }
  }

  return { price: bestPrice, priceText: bestPriceText, currency };
}

/**
 * Extract price and currency from text using regex patterns
 */
function extractPriceFromText(text: string): { price: number | null; currency: string | null } {
  if (!text) return { price: null, currency: null };

  // Currency patterns
  const currencyPatterns = [
    { symbol: '$', code: 'USD', regex: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g },
    { symbol: '€', code: 'EUR', regex: /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g },
    { symbol: '£', code: 'GBP', regex: /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g },
    { symbol: '¥', code: 'JPY', regex: /¥\s*(\d{1,3}(?:,\d{3})*)/g },
    { symbol: 'USD', code: 'USD', regex: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi },
    { symbol: 'EUR', code: 'EUR', regex: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*EUR/gi },
  ];

  for (const pattern of currencyPatterns) {
    const matches = [...text.matchAll(pattern.regex)];
    if (matches.length > 0) {
      const priceStr = matches[0][1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return { price, currency: pattern.code };
      }
    }
  }

  // Fallback: look for any number that might be a price
  const numberMatch = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (numberMatch) {
    const price = parseFloat(numberMatch[1].replace(/,/g, ''));
    if (!isNaN(price) && price > 0 && price < 1000000) { // Reasonable price range
      return { price, currency: null };
    }
  }

  return { price: null, currency: null };
}

/**
 * Extract product name from the page
 */
export function extractProductName(): string | null {
  const nameSelectors = [
    'h1', 'h2', // Common heading selectors
    '.product-title', '.product-name', '.item-title', '.listing-title',
    '[data-testid*="title"]', '[data-testid*="name"]',
    '.x-item-title', // eBay
    '[data-test-id="listing-page-title"]', // Etsy
    '#productTitle', // Amazon
    '.product-single__title', // Shopify
    '.sqs-gallery-meta-container h1', // Squarespace
    '[class*="title"]', '[class*="name"]'
  ];

  for (const selector of nameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    } catch (error) {
      console.warn('SpendGuard: Error extracting product name from selector:', selector, error);
    }
  }

  // Fallback to page title
  return document.title || null;
}

/**
 * Categorize purchase based on URL and page content
 */
export function categorizePurchase(url: string, productName?: string, pageContent?: string): string {
  const categories = {
    'electronics': [
      'laptop', 'computer', 'phone', 'tablet', 'headphones', 'speaker', 'tv', 'monitor',
      'camera', 'gaming', 'console', 'iphone', 'android', 'macbook', 'ipad', 'watch',
      'electronics', 'tech', 'gadget', 'device', 'smart', 'wireless', 'bluetooth'
    ],
    'clothing': [
      'shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat', 'jeans', 'sweater',
      'hoodie', 'sneakers', 'boots', 'clothing', 'fashion', 'apparel', 'wear',
      'outfit', 'style', 'footwear', 'accessory', 'hat', 'bag', 'jewelry'
    ],
    'home': [
      'furniture', 'chair', 'table', 'bed', 'sofa', 'lamp', 'decor', 'kitchen',
      'bathroom', 'bedroom', 'living', 'dining', 'storage', 'organization',
      'home', 'house', 'apartment', 'room', 'space', 'interior', 'design'
    ],
    'health': [
      'vitamin', 'supplement', 'medicine', 'health', 'fitness', 'wellness',
      'beauty', 'skincare', 'cosmetic', 'makeup', 'personal', 'care', 'hygiene'
    ],
    'books': [
      'book', 'ebook', 'kindle', 'novel', 'textbook', 'magazine', 'journal',
      'reading', 'literature', 'education', 'learning', 'study', 'academic'
    ],
    'food': [
      'food', 'snack', 'drink', 'coffee', 'tea', 'meal', 'grocery', 'restaurant',
      'delivery', 'takeout', 'dining', 'cuisine', 'recipe', 'ingredient'
    ],
    'entertainment': [
      'game', 'movie', 'music', 'streaming', 'subscription', 'ticket', 'event',
      'concert', 'show', 'entertainment', 'hobby', 'sport', 'recreation'
    ],
    'travel': [
      'flight', 'hotel', 'travel', 'vacation', 'trip', 'booking', 'rental',
      'accommodation', 'transportation', 'tourism', 'luggage', 'trip'
    ]
  };

  const textToAnalyze = [
    url.toLowerCase(),
    productName?.toLowerCase() || '',
    pageContent?.toLowerCase() || '',
    document.title.toLowerCase()
  ].join(' ');

  // Count keyword matches for each category
  const categoryScores: { [key: string]: number } = {};
  
  for (const [category, keywords] of Object.entries(categories)) {
    categoryScores[category] = keywords.reduce((score, keyword) => {
      const matches = (textToAnalyze.match(new RegExp(keyword, 'g')) || []).length;
      return score + matches;
    }, 0);
  }

  // Find category with highest score
  const bestCategory = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)[0];

  return bestCategory[1] > 0 ? bestCategory[0] : 'general';
}

/**
 * Extract comprehensive purchase context from current page
 */
export function extractPurchaseContext(): PurchaseContext {
  const priceInfo = extractPrice();
  const productName = extractProductName();
  const category = categorizePurchase(window.location.href, productName || undefined);
  
  // Detect platform
  const platform = detectPlatform(window.location.href);
  
  // Extract product image
  const imageUrl = extractProductImage();
  
  // Extract description
  const description = extractProductDescription();

  return {
    url: window.location.href,
    pageTitle: document.title,
    productName: productName || undefined,
    price: priceInfo.price || undefined,
    priceText: priceInfo.priceText || undefined,
    currency: priceInfo.currency || undefined,
    category,
    platform,
    imageUrl: imageUrl || undefined,
    description: description || undefined
  };
}

/**
 * Detect e-commerce platform from URL
 */
function detectPlatform(url: string): string {
  const platforms = [
    { name: 'Amazon', patterns: ['amazon.com', 'amazon.', 'a.co'] },
    { name: 'eBay', patterns: ['ebay.com', 'ebay.'] },
    { name: 'Etsy', patterns: ['etsy.com'] },
    { name: 'Shopify', patterns: ['myshopify.com', '.shopify.'] },
    { name: 'Stripe', patterns: ['checkout.stripe.com'] },
    { name: 'PayPal', patterns: ['paypal.com'] },
    { name: 'WooCommerce', patterns: ['/wc-', 'woocommerce'] },
    { name: 'Squarespace', patterns: ['squarespace.com'] },
    { name: 'BigCommerce', patterns: ['bigcommerce.com'] }
  ];

  for (const platform of platforms) {
    if (platform.patterns.some(pattern => url.includes(pattern))) {
      return platform.name;
    }
  }

  return 'Unknown';
}

/**
 * Extract product image URL
 */
function extractProductImage(): string | null {
  const imageSelectors = [
    '.product-image img', '.product-photo img', '.item-image img',
    '[data-testid*="image"] img', '#landingImage', '.gallery-image img',
    '.product-gallery img', '.main-image img', '.hero-image img'
  ];

  for (const selector of imageSelectors) {
    try {
      const img = document.querySelector(selector) as HTMLImageElement;
      if (img?.src) {
        return img.src;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  return null;
}

/**
 * Extract product description
 */
function extractProductDescription(): string | null {
  const descSelectors = [
    '.product-description', '.item-description', '.product-details',
    '[data-testid*="description"]', '.description', '.product-info',
    '.product-summary', '.item-details'
  ];

  for (const selector of descSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim().substring(0, 500); // Limit length
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  return null;
}

/**
 * Analyze if price seems high for the category
 */
export function analyzePriceLevel(price: number, category: string): 'low' | 'medium' | 'high' | 'very-high' {
  // Simple price thresholds by category (in USD)
  const thresholds = {
    electronics: { medium: 100, high: 500, veryHigh: 1500 },
    clothing: { medium: 50, high: 200, veryHigh: 500 },
    home: { medium: 75, high: 300, veryHigh: 1000 },
    health: { medium: 25, high: 100, veryHigh: 300 },
    books: { medium: 15, high: 50, veryHigh: 150 },
    food: { medium: 20, high: 75, veryHigh: 200 },
    entertainment: { medium: 30, high: 100, veryHigh: 300 },
    travel: { medium: 100, high: 500, veryHigh: 2000 },
    general: { medium: 50, high: 200, veryHigh: 600 }
  };

  const categoryThresholds = thresholds[category as keyof typeof thresholds] || thresholds.general;

  if (price >= categoryThresholds.veryHigh) return 'very-high';
  if (price >= categoryThresholds.high) return 'high';
  if (price >= categoryThresholds.medium) return 'medium';
  return 'low';
}
