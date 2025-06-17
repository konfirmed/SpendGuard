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
  })().catch(err => {
    console.error('SpendGuard background error:', err);
    sendResponse({ success: false, error: err.message });
  });

  // Return true to keep the message channel open for async response
  return true;
});