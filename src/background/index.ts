// src/background/index.ts

const STORAGE_KEY_PURCHASES = 'purchases';
const STORAGE_KEY_INTERCEPTS = 'totalIntercepts';

/**
 * Async wrapper around chrome.storage.local.get
 */
async function getStorage<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T;
}

/**
 * Async wrapper around chrome.storage.local.set
 */
async function setStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// On install, initialize our storage keys
chrome.runtime.onInstalled.addListener(async () => {
  console.log('SpendGuard installed – initializing storage');
  await setStorage(STORAGE_KEY_PURCHASES, []);
  await setStorage(STORAGE_KEY_INTERCEPTS, 0);
  await setStorage('settings', {
    cooldownSeconds: 30,
    enableNudges: true,
    enableScamDetection: true,
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.action === 'incrementIntercepts') {
      const current = (await getStorage<number>(STORAGE_KEY_INTERCEPTS)) || 0;
      const updated = current + 1;
      await setStorage(STORAGE_KEY_INTERCEPTS, updated);
      sendResponse({ success: true, newCount: updated });
    }

    if (message.action === 'addPurchase') {
      const list = (await getStorage<any[]>(STORAGE_KEY_PURCHASES)) || [];
      list.unshift({ ...message.purchase, id: Date.now().toString() });
      if (list.length > 100) list.splice(100);
      await setStorage(STORAGE_KEY_PURCHASES, list);
      sendResponse({ success: true });
    }

    if (message.action === 'getSettings') {
      const settings = (await getStorage<any>('settings')) || {
        cooldownSeconds: 30,
        enableNudges: true,
        enableScamDetection: true,
        categoryBudgets: {
          Electronics: 500,
          Clothing: 300,
          Books: 100,
          Home: 400,
          Other: 200
        }
      };
      sendResponse({ success: true, settings });
    }

    if (message.action === 'getRecentPurchases') {
      const purchases = (await getStorage<any[]>(STORAGE_KEY_PURCHASES)) || [];
      sendResponse({ success: true, purchases });
    }

    if (message.action === 'updateSettings') {
      await setStorage('settings', message.settings);
      sendResponse({ success: true });
    }

    if (message.action === 'getSpendingInsights') {
      const purchases = (await getStorage<any[]>(STORAGE_KEY_PURCHASES)) || [];
      const intercepts = (await getStorage<number>(STORAGE_KEY_INTERCEPTS)) || 0;
      
      // Calculate basic insights
      const thisWeekStart = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const thisWeekIntercepts = purchases.filter(p => 
        p.intercepted && p.timestamp > thisWeekStart
      ).length;
      
      const completedPurchases = purchases.filter(p => p.proceeded);
      const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const preventedPurchases = purchases.filter(p => p.intercepted && !p.proceeded);
      const estimatedSavings = preventedPurchases.reduce((sum, p) => sum + (p.amount || 50), 0);
      
      sendResponse({
        success: true,
        insights: {
          totalIntercepts: intercepts,
          thisWeekIntercepts,
          totalSpent,
          estimatedSavings,
          recentPurchases: purchases.slice(0, 10)
        }
      });
    }
  })().catch(err => {
    console.error('SpendGuard background error:', err);
    sendResponse({ success: false, error: err.message });
  });

  // Return true to keep the message channel open for async response
  return true;
});