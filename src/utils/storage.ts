/**
 * Chrome Storage API utilities for SpendGuard
 * Provides type-safe wrapper functions for chrome.storage.local
 */

export interface PurchaseEntry {
  id: string;
  url: string;
  timestamp: number;
  reason?: string;
  amount?: number;
  intercepted: boolean;
  proceeded: boolean;
}

export interface StorageData {
  purchases: PurchaseEntry[];
  totalIntercepts: number;
  settings: {
    cooldownSeconds: number;
    enableNudges: boolean;
    enableScamDetection: boolean;
  };
}

/**
 * Get an item from Chrome storage
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error('Storage getItem error:', error);
    return null;
  }
}

/**
 * Set an item in Chrome storage
 */
export async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error('Storage setItem error:', error);
    return false;
  }
}

/**
 * Remove an item from Chrome storage
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove([key]);
    return true;
  } catch (error) {
    console.error('Storage removeItem error:', error);
    return false;
  }
}

/**
 * Get all items from Chrome storage
 */
export async function getAll(): Promise<Record<string, any>> {
  try {
    return await chrome.storage.local.get();
  } catch (error) {
    console.error('Storage getAll error:', error);
    return {};
  }
}

/**
 * Get purchase entries from storage
 */
export async function getPurchases(): Promise<PurchaseEntry[]> {
  const purchases = await getItem<PurchaseEntry[]>('purchases');
  return purchases || [];
}

/**
 * Add a new purchase entry
 */
export async function addPurchase(purchase: Omit<PurchaseEntry, 'id'>): Promise<boolean> {
  const purchases = await getPurchases();
  const newPurchase: PurchaseEntry = {
    ...purchase,
    id: Date.now().toString(),
  };
  
  purchases.unshift(newPurchase); // Add to beginning
  
  // Keep only last 100 entries
  if (purchases.length > 100) {
    purchases.splice(100);
  }
  
  return await setItem('purchases', purchases);
}

/**
 * Get total intercepts count
 */
export async function getTotalIntercepts(): Promise<number> {
  const count = await getItem<number>('totalIntercepts');
  return count || 0;
}

/**
 * Increment total intercepts count
 */
export async function incrementIntercepts(): Promise<boolean> {
  const current = await getTotalIntercepts();
  return await setItem('totalIntercepts', current + 1);
}

/**
 * Get user settings with defaults
 */
export async function getSettings(): Promise<StorageData['settings']> {
  const settings = await getItem<StorageData['settings']>('settings');
  return settings || {
    cooldownSeconds: 30,
    enableNudges: true,
    enableScamDetection: true,
  };
}

/**
 * Update user settings
 */
export async function updateSettings(newSettings: Partial<StorageData['settings']>): Promise<boolean> {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  return await setItem('settings', updatedSettings);
}