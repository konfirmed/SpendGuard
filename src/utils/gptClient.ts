/**
 * Chrome AI client for generating personalized purchase nudges
 * Uses Chrome's inbuilt AI (if available), falls back to generic nudges
 */

interface PurchaseContext {
  url: string;
  pageTitle?: string;
  productName?: string;
  price?: string;
  category?: string;
  previousPurchases?: string[];
  timeOfDay?: string;
  dayOfWeek?: string;
}

/**
 * Get a personalized nudge from Chrome's inbuilt AI based on purchase context
 */
export async function getGPTNudge(purchaseContext: string | PurchaseContext): Promise<string> {
  // Try to use Chrome's inbuilt AI (e.g., chrome.summarize or chrome.sidePanel AI)
  if (chrome && (chrome as any).summarize) {
    try {
      const contextString = typeof purchaseContext === 'string'
        ? purchaseContext
        : formatContextForAI(purchaseContext);
      // Use the summarize API for a nudge prompt
      const prompt = createNudgePrompt(contextString);
      const summary = await (chrome as any).summarize({ prompt });
      if (summary && typeof summary === 'string') {
        return summary.trim();
      }
    } catch (err) {
      console.warn('WebAssistant: Chrome AI summarize failed', err);
    }
  }
  // Fallback: generic nudge
  return getGenericNudge();
}

function formatContextForAI(context: PurchaseContext): string {
  const parts = [
    `URL: ${context.url}`,
    context.pageTitle && `Page: ${context.pageTitle}`,
    context.productName && `Product: ${context.productName}`,
    context.price && `Price: ${context.price}`,
    context.category && `Category: ${context.category}`,
    context.timeOfDay && `Time: ${context.timeOfDay}`,
    context.dayOfWeek && `Day: ${context.dayOfWeek}`,
    context.previousPurchases?.length && `Recent purchases: ${context.previousPurchases.join(', ')}`
  ].filter(Boolean);
  return parts.join('\n');
}

function createNudgePrompt(context: string): string {
  return `A user is about to make an online purchase. Here's the context:\n\n${context}\n\nPlease provide a brief, helpful nudge that encourages them to pause and consider this purchase thoughtfully. Focus on:\n- Whether this seems like an impulse buy\n- If they should wait or do more research\n- Gentle questions to help them reflect\n- Practical considerations\n\nKeep it supportive and under 100 words.`;
}

function getGenericNudge(): string {
  const nudges = [
    "Before you buy, ask yourself: Do I need this, or do I just want it? Sometimes waiting 24 hours can bring clarity.",
    "Consider this: Will you still want this item next week? If yes, it might be worth the purchase. If not, maybe skip it for now.",
    "Quick check: Is this in your budget? Have you compared prices elsewhere? A few minutes of research could save you money.",
    "Pause for a moment. What problem does this solve for you? If you can't think of a specific need, it might be worth reconsidering.",
    "Before completing this purchase, think about your financial goals. Does this align with what you're trying to achieve?",
    "Consider waiting until tomorrow to make this decision. Impulse purchases often lead to regret, while thoughtful ones bring satisfaction."
  ];
  return nudges[Math.floor(Math.random() * nudges.length)];
}

/**
 * Get purchase insights based on browsing behavior (using Chrome AI if available)
 */
export async function getPurchaseInsight(url: string, price?: number): Promise<string> {
  if (chrome && (chrome as any).summarize) {
    try {
      const prompt = `Analyze this purchase URL and provide a brief insight: ${url}${price ? ` (Price: $${price})` : ''}\n\nProvide a one-sentence insight about this type of purchase, focusing on value, timing, or smart shopping tips.`;
      const summary = await (chrome as any).summarize({ prompt });
      if (summary && typeof summary === 'string') {
        return summary.trim();
      }
    } catch (err) {
      console.warn('WebAssistant: Chrome AI summarize failed', err);
    }
  }
  return "Consider if this purchase aligns with your financial goals and current needs.";
}