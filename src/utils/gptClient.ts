/**
 * OpenAI GPT client for generating personalized purchase nudges
 * Provides context-aware suggestions and insights
 */

interface GPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

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
 * Get a personalized nudge from GPT based on purchase context
 */
export async function getGPTNudge(purchaseContext: string | PurchaseContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('WebAssistant: OpenAI API key not configured');
    return getGenericNudge();
  }

  try {
    const contextString = typeof purchaseContext === 'string' 
      ? purchaseContext 
      : formatContextForGPT(purchaseContext);

    const prompt = createNudgePrompt(contextString);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful financial advisor assistant built into a browser extension. Your job is to provide brief, thoughtful nudges to help users make better purchasing decisions. Be supportive, not preachy. Keep responses under 100 words and focus on practical considerations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: GPTResponse = await response.json();
    const nudge = data.choices[0]?.message?.content?.trim();
    
    return nudge || getGenericNudge();
    
  } catch (error) {
    console.error('WebAssistant: Error getting GPT nudge:', error);
    return getGenericNudge();
  }
}

/**
 * Format purchase context object into a string for GPT
 */
function formatContextForGPT(context: PurchaseContext): string {
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

/**
 * Create a thoughtful prompt for GPT
 */
function createNudgePrompt(context: string): string {
  return `A user is about to make an online purchase. Here's the context:

${context}

Please provide a brief, helpful nudge that encourages them to pause and consider this purchase thoughtfully. Focus on:
- Whether this seems like an impulse buy
- If they should wait or do more research
- Gentle questions to help them reflect
- Practical considerations

Keep it supportive and under 100 words.`;
}

/**
 * Fallback nudges when GPT is unavailable
 */
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
 * Get purchase insights based on browsing behavior
 */
export async function getPurchaseInsight(url: string, price?: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return "Consider if this purchase aligns with your financial goals and current needs.";
  }

  try {
    const prompt = `Analyze this purchase URL and provide a brief insight: ${url}${price ? ` (Price: $${price})` : ''}
    
    Provide a one-sentence insight about this type of purchase, focusing on value, timing, or smart shopping tips.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a shopping advisor. Provide brief, practical insights about purchases.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: GPTResponse = await response.json();
    return data.choices[0]?.message?.content?.trim() || "Consider if this purchase aligns with your financial goals.";
    
  } catch (error) {
    console.error('WebAssistant: Error getting purchase insight:', error);
    return "Consider if this purchase aligns with your financial goals and current needs.";
  }
}