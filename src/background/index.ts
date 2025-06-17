/**
 * Background service worker for WebAssistant
 * Handles extension lifecycle and cross-tab communication
 */

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('WebAssistant extension installed');
  
  // Set default storage values
  chrome.storage.local.set({
    purchases: [],
    totalIntercepts: 0,
    settings: {
      cooldownSeconds: 30,
      enableNudges: true,
      enableScamDetection: true,
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === 'incrementIntercepts') {
    chrome.storage.local.get(['totalIntercepts'], (result: { totalIntercepts?: number }) => {
      const newCount = (result.totalIntercepts || 0) + 1;
      chrome.storage.local.set({ totalIntercepts: newCount });
      sendResponse({ success: true, newCount });
    });
    return true; // Indicates we will send a response asynchronously
  }
  
  if (request.action === 'addPurchase') {
    chrome.storage.local.get(['purchases'], (result: { purchases?: any[] }) => {
      const purchases = result.purchases || [];
      const newPurchase = {
        ...request.purchase,
        id: Date.now().toString(),
      };
      
      purchases.unshift(newPurchase);
      
      // Keep only last 100 entries
      if (purchases.length > 100) {
        purchases.splice(100);
      }
      
      chrome.storage.local.set({ purchases });
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener(() => {
  console.log('WebAssistant update available');
});

export {};