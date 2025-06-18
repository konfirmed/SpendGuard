/**
 * Chrome extension messaging utilities for content scripts
 * Provides communication between content scripts and background script
 */

export interface PurchaseEntry {
  id?: string;
  url: string;
  timestamp: number;
  reason?: string;
  amount?: number;
  intercepted: boolean;
  proceeded: boolean;
}

export interface Settings {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
}

/**
 * Send a message to the background script and wait for response
 */
async function sendMessage<T>(message: any): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error('Chrome runtime not available'));
      return;
    }

    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response?.success === false) {
        reject(new Error(response.error || 'Unknown error'));
        return;
      }
      
      resolve(response);
    });
  });
}

/**
 * Add a purchase entry via background script
 */
export async function addPurchase(purchase: Omit<PurchaseEntry, 'id'>): Promise<boolean> {
  try {
    await sendMessage({
      action: 'addPurchase',
      purchase
    });
    return true;
  } catch (error) {
    console.error('SpendGuard: Failed to add purchase:', error);
    return false;
  }
}

/**
 * Increment intercepts count via background script
 */
export async function incrementIntercepts(): Promise<number> {
  try {
    const response = await sendMessage<{ newCount: number }>({
      action: 'incrementIntercepts'
    });
    return response.newCount;
  } catch (error) {
    console.error('SpendGuard: Failed to increment intercepts:', error);
    return 0;
  }
}

/**
 * Get settings from storage via background script
 */
export async function getSettings(): Promise<Settings> {
  try {
    const response = await sendMessage<{ settings: Settings }>({
      action: 'getSettings'
    });
    return response.settings;
  } catch (error) {
    console.error('SpendGuard: Failed to get settings:', error);
    // Return default settings on error
    return {
      cooldownSeconds: 30,
      enableNudges: true,
      enableScamDetection: true,
    };
  }
}
