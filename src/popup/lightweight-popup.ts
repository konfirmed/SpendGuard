/**
 * Lightweight SpendGuard Popup
 * No React, minimal bundle size, vanilla TypeScript
 */

interface Settings {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
}

interface PurchaseEntry {
  id: string;
  url: string;
  timestamp: number;
  intercepted: boolean;
  proceeded: boolean;
  amount?: number;
}

interface Stats {
  totalIntercepts: number;
  thisWeekIntercepts: number;
  recentPurchases: PurchaseEntry[];
}

class LightweightPopup {
  private container: HTMLElement;
  private activeTab: 'stats' | 'settings' = 'stats';

  constructor() {
    this.container = document.getElementById('root')!;
    if (!this.container) {
      console.error('SpendGuard: Root element not found');
      return;
    }
    this.init();
  }

  private async init() {
    this.showLoading();
    
    try {
      const [settings, stats] = await Promise.all([
        this.getSettings(),
        this.getStats()
      ]);
      
      this.render(settings, stats);
      this.setupEventListeners(settings);
    } catch (error) {
      this.showError(error);
    }
  }

  private showLoading() {
    this.container.innerHTML = `
      <div style="
        width: 320px;
        height: 480px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        "></div>
        <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
          Loading SpendGuard...
        </p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }

  private showError(error: any) {
    this.container.innerHTML = `
      <div style="
        width: 320px;
        height: 480px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #fef2f2;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: #fecaca;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        ">
          <svg width="24" height="24" fill="#dc2626" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <h3 style="margin: 0 0 0.5rem 0; color: #991b1b; font-weight: 600;">
          Error Loading Data
        </h3>
        <p style="margin: 0 0 1rem 0; color: #7f1d1d; font-size: 0.875rem; text-align: center;">
          ${error?.message || 'Failed to load SpendGuard data'}
        </p>
        <button onclick="location.reload()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        ">
          Try Again
        </button>
      </div>
    `;
  }

  private render(settings: Settings, stats: Stats) {
    this.container.innerHTML = `
      <div style="
        width: 320px;
        background: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          padding: 1rem;
        ">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h1 style="margin: 0; font-size: 1.125rem; font-weight: 700;">SpendGuard</h1>
              <p style="margin: 0; font-size: 0.75rem; opacity: 0.9;">Your spending companion</p>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="display: flex; border-bottom: 1px solid #e5e7eb;">
          <button id="stats-tab" style="
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            background: ${this.activeTab === 'stats' ? '#eff6ff' : 'white'};
            color: ${this.activeTab === 'stats' ? '#2563eb' : '#6b7280'};
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            border-bottom: ${this.activeTab === 'stats' ? '2px solid #2563eb' : 'none'};
          ">
            Dashboard
          </button>
          <button id="settings-tab" style="
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            background: ${this.activeTab === 'settings' ? '#eff6ff' : 'white'};
            color: ${this.activeTab === 'settings' ? '#2563eb' : '#6b7280'};
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            border-bottom: ${this.activeTab === 'settings' ? '2px solid #2563eb' : 'none'};
          ">
            Settings
          </button>
        </div>

        <!-- Content -->
        <div style="padding: 1rem; height: 320px; overflow-y: auto;">
          <div id="stats-content" style="display: ${this.activeTab === 'stats' ? 'block' : 'none'};">
            ${this.renderStatsTab(stats)}
          </div>
          <div id="settings-content" style="display: ${this.activeTab === 'settings' ? 'block' : 'none'};">
            ${this.renderSettingsTab(settings)}
          </div>
        </div>
      </div>
    `;
  }

  private renderStatsTab(stats: Stats): string {
    return `
      <!-- Stats Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="background: #dbeafe; padding: 0.75rem; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb;">
            ${stats.thisWeekIntercepts}
          </div>
          <div style="font-size: 0.75rem; color: #6b7280;">This week</div>
        </div>
        <div style="background: #d1fae5; padding: 0.75rem; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">
            ${stats.totalIntercepts}
          </div>
          <div style="font-size: 0.75rem; color: #6b7280;">Total saved</div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <h3 style="margin: 0 0 0.75rem 0; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          Recent Activity
        </h3>
        
        ${stats.recentPurchases.length === 0 ? `
          <div style="text-align: center; padding: 2rem 0; color: #6b7280;">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.75rem auto; opacity: 0.5;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <p style="margin: 0; font-size: 0.875rem;">No purchase activity yet</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #9ca3af;">
              SpendGuard will track your checkout interactions
            </p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${stats.recentPurchases.map(purchase => `
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                background: #f9fafb;
                border-radius: 8px;
              ">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.875rem; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${this.getDomainFromUrl(purchase.url)}
                  </div>
                  <div style="font-size: 0.75rem; color: #6b7280;">
                    ${this.formatDate(purchase.timestamp)}
                  </div>
                </div>
                <div style="margin-left: 0.75rem;">
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    ${purchase.intercepted ? (
                      purchase.proceeded 
                        ? 'background: #fef3c7; color: #d97706;' 
                        : 'background: #d1fae5; color: #059669;'
                    ) : 'background: #f3f4f6; color: #6b7280;'}
                  ">
                    ${purchase.intercepted ? (purchase.proceeded ? 'Proceeded' : 'Prevented') : 'Direct'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  private renderSettingsTab(settings: Settings): string {
    return `
      <div>
        <h3 style="margin: 0 0 1rem 0; font-weight: 600; color: #111827;">Preferences</h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Cooldown Duration -->
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem;">
              Cooldown Duration
            </label>
            <select id="cooldown-select" style="
              width: 100%;
              padding: 0.5rem 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 0.875rem;
              background: white;
              color: #111827;
            ">
              <option value="15" ${settings.cooldownSeconds === 15 ? 'selected' : ''}>15 seconds</option>
              <option value="30" ${settings.cooldownSeconds === 30 ? 'selected' : ''}>30 seconds</option>
              <option value="60" ${settings.cooldownSeconds === 60 ? 'selected' : ''}>1 minute</option>
              <option value="120" ${settings.cooldownSeconds === 120 ? 'selected' : ''}>2 minutes</option>
              <option value="300" ${settings.cooldownSeconds === 300 ? 'selected' : ''}>5 minutes</option>
            </select>
          </div>

          <!-- AI Nudges -->
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <label style="font-weight: 500; color: #374151; font-size: 0.875rem;">AI Nudges</label>
              <p style="margin: 0.25rem 0 0 0; color: #6b7280; font-size: 0.75rem;">
                Get personalized purchase insights
              </p>
            </div>
            <button id="nudges-toggle" data-enabled="${settings.enableNudges}" style="
              position: relative;
              width: 44px;
              height: 24px;
              background: ${settings.enableNudges ? '#2563eb' : '#d1d5db'};
              border: none;
              border-radius: 12px;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              <span style="
                position: absolute;
                top: 2px;
                left: ${settings.enableNudges ? '22px' : '2px'};
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: left 0.2s;
              "></span>
            </button>
          </div>

          <!-- Scam Detection -->
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <label style="font-weight: 500; color: #374151; font-size: 0.875rem;">Scam Detection</label>
              <p style="margin: 0.25rem 0 0 0; color: #6b7280; font-size: 0.75rem;">
                Warn about suspicious websites
              </p>
            </div>
            <button id="scam-toggle" data-enabled="${settings.enableScamDetection}" style="
              position: relative;
              width: 44px;
              height: 24px;
              background: ${settings.enableScamDetection ? '#2563eb' : '#d1d5db'};
              border: none;
              border-radius: 12px;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              <span style="
                position: absolute;
                top: 2px;
                left: ${settings.enableScamDetection ? '22px' : '2px'};
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: left 0.2s;
              "></span>
            </button>
          </div>
        </div>
      </div>

      <!-- About -->
      <div style="
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      ">
        <div style="color: #9ca3af; font-size: 0.75rem; line-height: 1.4;">
          <p style="margin: 0;">SpendGuard v1.0.0</p>
          <p style="margin: 0.25rem 0 0 0;">Built to help you make smarter purchase decisions</p>
        </div>
      </div>
    `;
  }

  private setupEventListeners(initialSettings: Settings) {
    let currentSettings = { ...initialSettings };

    // Tab switching
    const statsTab = document.getElementById('stats-tab')!;
    const settingsTab = document.getElementById('settings-tab')!;
    const statsContent = document.getElementById('stats-content')!;
    const settingsContent = document.getElementById('settings-content')!;

    statsTab.addEventListener('click', () => {
      this.activeTab = 'stats';
      this.updateTabStyles(statsTab, settingsTab);
      statsContent.style.display = 'block';
      settingsContent.style.display = 'none';
    });

    settingsTab.addEventListener('click', () => {
      this.activeTab = 'settings';
      this.updateTabStyles(settingsTab, statsTab);
      statsContent.style.display = 'none';
      settingsContent.style.display = 'block';
    });

    // Settings
    const cooldownSelect = document.getElementById('cooldown-select') as HTMLSelectElement;
    const nudgesToggle = document.getElementById('nudges-toggle')!;
    const scamToggle = document.getElementById('scam-toggle')!;

    cooldownSelect?.addEventListener('change', () => {
      currentSettings.cooldownSeconds = parseInt(cooldownSelect.value);
      this.saveSettings(currentSettings);
    });

    nudgesToggle?.addEventListener('click', () => {
      currentSettings.enableNudges = !currentSettings.enableNudges;
      this.updateToggle(nudgesToggle, currentSettings.enableNudges);
      this.saveSettings(currentSettings);
    });

    scamToggle?.addEventListener('click', () => {
      currentSettings.enableScamDetection = !currentSettings.enableScamDetection;
      this.updateToggle(scamToggle, currentSettings.enableScamDetection);
      this.saveSettings(currentSettings);
    });
  }

  private updateTabStyles(activeTab: HTMLElement, inactiveTab: HTMLElement) {
    activeTab.style.background = '#eff6ff';
    activeTab.style.color = '#2563eb';
    activeTab.style.borderBottom = '2px solid #2563eb';
    
    inactiveTab.style.background = 'white';
    inactiveTab.style.color = '#6b7280';
    inactiveTab.style.borderBottom = 'none';
  }

  private updateToggle(toggle: HTMLElement, enabled: boolean) {
    const span = toggle.querySelector('span')!;
    toggle.style.background = enabled ? '#2563eb' : '#d1d5db';
    span.style.left = enabled ? '22px' : '2px';
    toggle.setAttribute('data-enabled', enabled.toString());
  }

  private async getSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response?.settings || {
          cooldownSeconds: 30,
          enableNudges: true,
          enableScamDetection: true
        });
      });
    });
  }

  private async getStats(): Promise<Stats> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['totalIntercepts', 'purchases'], result => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const totalIntercepts = result.totalIntercepts || 0;
        const purchases = (result.purchases || []) as PurchaseEntry[];
        
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const thisWeekIntercepts = purchases.filter(p => 
          p.timestamp > weekAgo && p.intercepted
        ).length;

        resolve({
          totalIntercepts,
          thisWeekIntercepts,
          recentPurchases: purchases.slice(0, 5)
        });
      });
    });
  }

  private saveSettings(settings: Settings) {
    chrome.storage.local.set({ settings });
  }

  private getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url || 'Unknown site';
    }
  }

  private formatDate(timestamp: number): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LightweightPopup();
});

// Global error handling
window.addEventListener('error', (event) => {
  console.error('SpendGuard popup error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('SpendGuard popup unhandled promise rejection:', event.reason);
});
