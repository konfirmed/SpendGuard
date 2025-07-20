/**
 * Enhanced SpendGuard Popup with Analytics Dashboard
 * Provides comprehensive spending insights and advanced settings
 */

interface Settings {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
  categoryBudgets: Record<string, number>;
}

interface SpendingInsights {
  totalIntercepts: number;
  thisWeekIntercepts: number;
  totalSpent: number;
  estimatedSavings: number;
  recentPurchases: any[];
}

class EnhancedPopup {
  private container: HTMLElement;
  private activeTab: 'dashboard' | 'analytics' | 'settings' = 'dashboard';

  constructor() {
    this.container = document.getElementById('root')!;
    if (!this.container) {
      throw new Error('Root element not found');
    }
    this.init();
  }

  private async init() {
    this.showLoading();
    
    try {
      const [settings, insights] = await Promise.all([
        this.getSettings(),
        this.getSpendingInsights()
      ]);
      
      this.render(settings, insights);
      this.setupEventListeners(settings, insights);
    } catch (error) {
      console.error('SpendGuard popup error:', error);
      this.showError(error);
    }
  }

  private showLoading() {
    this.container.innerHTML = `
      <div style="
        width: 380px;
        height: 520px;
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
        width: 380px;
        height: 520px;
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

  private render(settings: Settings, insights: SpendingInsights) {
    this.container.innerHTML = `
      <div style="
        width: 380px;
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
              <p style="margin: 0; font-size: 0.75rem; opacity: 0.9;">Smart spending companion</p>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="display: flex; border-bottom: 1px solid #e5e7eb;">
          <button id="dashboard-tab" style="
            flex: 1;
            padding: 0.75rem 0.5rem;
            border: none;
            background: ${this.activeTab === 'dashboard' ? '#eff6ff' : 'white'};
            color: ${this.activeTab === 'dashboard' ? '#2563eb' : '#6b7280'};
            font-weight: 500;
            font-size: 0.8rem;
            cursor: pointer;
            border-bottom: ${this.activeTab === 'dashboard' ? '2px solid #2563eb' : 'none'};
          ">
            Dashboard
          </button>
          <button id="analytics-tab" style="
            flex: 1;
            padding: 0.75rem 0.5rem;
            border: none;
            background: ${this.activeTab === 'analytics' ? '#eff6ff' : 'white'};
            color: ${this.activeTab === 'analytics' ? '#2563eb' : '#6b7280'};
            font-weight: 500;
            font-size: 0.8rem;
            cursor: pointer;
            border-bottom: ${this.activeTab === 'analytics' ? '2px solid #2563eb' : 'none'};
          ">
            Analytics
          </button>
          <button id="settings-tab" style="
            flex: 1;
            padding: 0.75rem 0.5rem;
            border: none;
            background: ${this.activeTab === 'settings' ? '#eff6ff' : 'white'};
            color: ${this.activeTab === 'settings' ? '#2563eb' : '#6b7280'};
            font-weight: 500;
            font-size: 0.8rem;
            cursor: pointer;
            border-bottom: ${this.activeTab === 'settings' ? '2px solid #2563eb' : 'none'};
          ">
            Settings
          </button>
        </div>

        <!-- Content -->
        <div style="padding: 1rem; height: 380px; overflow-y: auto;">
          <div id="dashboard-content" style="display: ${this.activeTab === 'dashboard' ? 'block' : 'none'};">
            ${this.renderDashboard(insights)}
          </div>
          <div id="analytics-content" style="display: ${this.activeTab === 'analytics' ? 'block' : 'none'};">
            ${this.renderAnalytics(insights)}
          </div>
          <div id="settings-content" style="display: ${this.activeTab === 'settings' ? 'block' : 'none'};">
            ${this.renderSettings(settings)}
          </div>
        </div>
      </div>
    `;
  }

  private renderDashboard(insights: SpendingInsights): string {
    const savingsPercentage = insights.totalSpent > 0 
      ? ((insights.estimatedSavings / (insights.totalSpent + insights.estimatedSavings)) * 100).toFixed(1)
      : '0';

    return `
      <!-- Key Metrics -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="background: #dbeafe; padding: 0.75rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb;">
            ${insights.thisWeekIntercepts}
          </div>
          <div style="font-size: 0.75rem; color: #6b7280;">This week</div>
        </div>
        <div style="background: #d1fae5; padding: 0.75rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">
            $${insights.estimatedSavings}
          </div>
          <div style="font-size: 0.75rem; color: #6b7280;">Estimated saved</div>
        </div>
      </div>

      <!-- Savings Progress -->
      <div style="
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        border: 1px solid #e0f2fe;
      ">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div style="
            width: 40px;
            height: 40px;
            background: #2563eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; color: #0f172a;">Smart Savings</div>
            <div style="font-size: 0.875rem; color: #64748b;">You've avoided ${savingsPercentage}% of potential overspending</div>
          </div>
        </div>
        
        <div style="
          background: #e2e8f0;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        ">
          <div style="
            height: 100%;
            background: linear-gradient(90deg, #2563eb 0%, #059669 100%);
            width: ${Math.min(100, parseFloat(savingsPercentage))}%;
            transition: width 0.5s ease;
          "></div>
        </div>
        
        <div style="font-size: 0.75rem; color: #64748b; text-align: center;">
          Total Intercepted: ${insights.totalIntercepts} purchases
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button id="pause-protection" style="
          background: #f59e0b;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        ">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          Pause 1hr
        </button>
        
        <button id="view-report" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        ">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Full Report
        </button>
      </div>
    `;
  }

  private renderAnalytics(insights: SpendingInsights): string {
    return `
      <!-- Spending Overview -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Spending Analysis
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div style="text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px;">
            <div style="font-size: 1.25rem; font-weight: 700; color: #d97706;">$${insights.totalSpent}</div>
            <div style="font-size: 0.75rem; color: #92400e;">Total Spent</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: #d1fae5; border-radius: 8px;">
            <div style="font-size: 1.25rem; font-weight: 700; color: #059669;">$${insights.estimatedSavings}</div>
            <div style="font-size: 0.75rem; color: #047857;">Money Saved</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Timeline -->
      <div>
        <h3 style="margin: 0 0 1rem 0; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          Recent Activity
        </h3>
        
        ${insights.recentPurchases.length === 0 ? `
          <div style="text-align: center; padding: 2rem 0; color: #6b7280;">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.75rem auto; opacity: 0.5;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <p style="margin: 0; font-size: 0.875rem;">No activity yet</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #9ca3af;">
              Your purchase insights will appear here
            </p>
          </div>
        ` : `
          <div style="max-height: 220px; overflow-y: auto;">
            ${insights.recentPurchases.slice(0, 8).map((purchase, index) => `
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: ${index < insights.recentPurchases.length - 1 ? '1px solid #f1f5f9' : 'none'};
              ">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.875rem; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${this.getDomainFromUrl(purchase.url)}
                  </div>
                  <div style="font-size: 0.75rem; color: #6b7280;">
                    ${this.formatDate(purchase.timestamp)} ${purchase.amount ? `• $${purchase.amount}` : ''}
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
                    ${purchase.intercepted ? (purchase.proceeded ? '⚡ Proceeded' : '🛡️ Prevented') : '👀 Monitored'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  private renderSettings(settings: Settings): string {
    return `
      <!-- Core Settings -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; font-weight: 600; color: #111827;">Core Settings</h3>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0;">
            <span style="font-size: 0.875rem; color: #374151;">Enable Purchase Nudges</span>
            <div id="nudges-toggle" style="
              width: 44px;
              height: 24px;
              background: ${settings.enableNudges ? '#059669' : '#d1d5db'};
              border-radius: 12px;
              position: relative;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              <div style="
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 2px;
                left: ${settings.enableNudges ? '22px' : '2px'};
                transition: left 0.2s;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              "></div>
            </div>
          </label>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0;">
            <span style="font-size: 0.875rem; color: #374151;">Scam Detection</span>
            <div id="scam-toggle" style="
              width: 44px;
              height: 24px;
              background: ${settings.enableScamDetection ? '#059669' : '#d1d5db'};
              border-radius: 12px;
              position: relative;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              <div style="
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 2px;
                left: ${settings.enableScamDetection ? '22px' : '2px'};
                transition: left 0.2s;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              "></div>
            </div>
          </label>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">
            Cooldown Duration (seconds)
          </label>
          <input 
            id="cooldown-slider" 
            type="range" 
            min="5" 
            max="120" 
            value="${settings.cooldownSeconds}"
            style="
              width: 100%;
              height: 6px;
              background: #e5e7eb;
              border-radius: 3px;
              outline: none;
              -webkit-appearance: none;
            "
          />
          <div style="text-align: center; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
            <span id="cooldown-value">${settings.cooldownSeconds}</span> seconds
          </div>
        </div>
      </div>

      <!-- Budget Settings -->
      <div>
        <h3 style="margin: 0 0 1rem 0; font-weight: 600; color: #111827;">Monthly Budget Limits</h3>
        
        ${Object.entries(settings.categoryBudgets || {}).map(([category, budget]) => `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <span style="font-size: 0.875rem; color: #374151;">${category}</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.75rem; color: #6b7280;">$</span>
              <input 
                id="budget-${category.toLowerCase()}"
                type="number" 
                value="${budget}"
                min="0"
                max="5000"
                step="50"
                style="
                  width: 80px;
                  padding: 0.25rem 0.5rem;
                  border: 1px solid #d1d5db;
                  border-radius: 4px;
                  font-size: 0.875rem;
                  text-align: right;
                "
              />
            </div>
          </div>
        `).join('')}
        
        <button id="save-settings" style="
          width: 100%;
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 1rem;
          transition: background-color 0.2s;
        ">
          Save Settings
        </button>
      </div>
    `;
  }

  private setupEventListeners(initialSettings: Settings, initialInsights: SpendingInsights) {
    // Tab switching
    const dashboardTab = document.getElementById('dashboard-tab')!;
    const analyticsTab = document.getElementById('analytics-tab')!;
    const settingsTab = document.getElementById('settings-tab')!;

    dashboardTab.addEventListener('click', () => {
      this.activeTab = 'dashboard';
      this.render(initialSettings, initialInsights);
      this.setupEventListeners(initialSettings, initialInsights);
    });

    analyticsTab.addEventListener('click', () => {
      this.activeTab = 'analytics';
      this.render(initialSettings, initialInsights);
      this.setupEventListeners(initialSettings, initialInsights);
    });

    settingsTab.addEventListener('click', () => {
      this.activeTab = 'settings';
      this.render(initialSettings, initialInsights);
      this.setupEventListeners(initialSettings, initialInsights);
    });

    // Settings controls
    if (this.activeTab === 'settings') {
      this.setupSettingsListeners(initialSettings);
    }

    // Dashboard actions
    if (this.activeTab === 'dashboard') {
      const pauseBtn = document.getElementById('pause-protection');
      const reportBtn = document.getElementById('view-report');

      pauseBtn?.addEventListener('click', () => {
        // TODO: Implement pause functionality
        alert('Pause feature coming soon!');
      });

      reportBtn?.addEventListener('click', () => {
        this.activeTab = 'analytics';
        this.render(initialSettings, initialInsights);
        this.setupEventListeners(initialSettings, initialInsights);
      });
    }
  }

  private setupSettingsListeners(settings: Settings) {
    const nudgesToggle = document.getElementById('nudges-toggle')!;
    const scamToggle = document.getElementById('scam-toggle')!;
    const cooldownSlider = document.getElementById('cooldown-slider')! as HTMLInputElement;
    const cooldownValue = document.getElementById('cooldown-value')!;
    const saveBtn = document.getElementById('save-settings')!;

    let currentSettings = { ...settings };

    // Toggle handlers
    nudgesToggle.addEventListener('click', () => {
      currentSettings.enableNudges = !currentSettings.enableNudges;
      this.updateToggle(nudgesToggle, currentSettings.enableNudges);
    });

    scamToggle.addEventListener('click', () => {
      currentSettings.enableScamDetection = !currentSettings.enableScamDetection;
      this.updateToggle(scamToggle, currentSettings.enableScamDetection);
    });

    // Cooldown slider
    cooldownSlider.addEventListener('input', () => {
      currentSettings.cooldownSeconds = parseInt(cooldownSlider.value);
      cooldownValue.textContent = cooldownSlider.value;
    });

    // Budget inputs
    Object.keys(settings.categoryBudgets || {}).forEach(category => {
      const input = document.getElementById(`budget-${category.toLowerCase()}`) as HTMLInputElement;
      input?.addEventListener('change', () => {
        currentSettings.categoryBudgets[category] = parseInt(input.value) || 0;
      });
    });

    // Save button
    saveBtn.addEventListener('click', async () => {
      try {
        await this.saveSettings(currentSettings);
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#059669';
        setTimeout(() => {
          saveBtn.textContent = 'Save Settings';
          saveBtn.style.background = '#2563eb';
        }, 2000);
      } catch (error) {
        console.error('Failed to save settings:', error);
        saveBtn.textContent = 'Error!';
        saveBtn.style.background = '#dc2626';
        setTimeout(() => {
          saveBtn.textContent = 'Save Settings';
          saveBtn.style.background = '#2563eb';
        }, 2000);
      }
    });
  }

  private updateToggle(toggle: HTMLElement, enabled: boolean) {
    const background = enabled ? '#059669' : '#d1d5db';
    const position = enabled ? '22px' : '2px';
    
    toggle.style.background = background;
    const slider = toggle.querySelector('div') as HTMLElement;
    slider.style.left = position;
  }

  private async getSettings(): Promise<Settings> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response: any) => {
        resolve(response?.settings || {
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
        });
      });
    });
  }

  private async getSpendingInsights(): Promise<SpendingInsights> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getSpendingInsights' }, (response: any) => {
        resolve(response?.insights || {
          totalIntercepts: 0,
          thisWeekIntercepts: 0,
          totalSpent: 0,
          estimatedSavings: 0,
          recentPurchases: []
        });
      });
    });
  }

  private async saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'updateSettings', settings }, (response: any) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to save settings'));
        }
      });
    });
  }

  private getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
}

// Initialize enhanced popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedPopup();
});

// Global error handling
window.addEventListener('error', (event) => {
  console.error('SpendGuard popup error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('SpendGuard popup unhandled promise rejection:', event.reason);
});
