import React, { useState, useEffect, useCallback } from 'react';
import { getTotalIntercepts, getPurchases, getSettings, updateSettings } from '../utils/storage';
import type { PurchaseEntry } from '../utils/storage';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface SettingsState {
  cooldownSeconds: number;
  enableNudges: boolean;
  enableScamDetection: boolean;
}

/**
 * Main popup component for SpendGuard
 * Shows intercept stats, recent purchases, and settings
 */
const Popup: React.FC = () => {
  const [totalIntercepts, setTotalIntercepts] = useState<number>(0);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseEntry[]>([]);
  const [settings, setSettings] = useState<SettingsState>({
    cooldownSeconds: 30,
    enableNudges: true,
    enableScamDetection: true,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null
  });
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

  const loadData = useCallback(async () => {
    try {
      setLoadingState({ isLoading: true, error: null });
      
      const [intercepts, purchases, userSettings] = await Promise.all([
        getTotalIntercepts().catch(() => 0),
        getPurchases().catch(() => []),
        getSettings().catch(() => ({
          cooldownSeconds: 30,
          enableNudges: true,
          enableScamDetection: true,
        })),
      ]);

      setTotalIntercepts(intercepts);
      setRecentPurchases(purchases.slice(0, 5)); // Last 5 purchases
      setSettings(userSettings);
      setLoadingState({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading popup data:', error);
      setLoadingState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load data'
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingChange = useCallback(async (key: keyof SettingsState, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert on error
      loadData();
    }
  }, [settings, loadData]);

  const getThisWeekIntercepts = useCallback(() => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return recentPurchases.filter(p => p.timestamp > weekAgo && p.intercepted).length;
  }, [recentPurchases]);

  const formatDate = useCallback((timestamp: number) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  }, []);

  const getDomainFromUrl = useCallback((url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url || 'Unknown site';
    }
  }, []);

  if (loadingState.isLoading) {
    return (
      <div className="w-80 h-96 flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-gray-600">Loading SpendGuard...</p>
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className="w-80 h-96 flex flex-col items-center justify-center bg-red-50 p-4">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-sm text-red-600 text-center mb-4">{loadingState.error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          type="button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg">SpendGuard</h1>
            <p className="text-sm opacity-90">Your spending companion</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'stats'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 h-80 overflow-y-auto">
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{getThisWeekIntercepts()}</div>
                <div className="text-sm text-gray-600">This week</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalIntercepts}</div>
                <div className="text-sm text-gray-600">Total saved</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Recent Activity
              </h3>
              
              {recentPurchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  <p className="text-sm">No purchase activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">SpendGuard will track your checkout interactions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {getDomainFromUrl(purchase.url)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(purchase.timestamp)}
                        </div>
                        {purchase.reason && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            "{purchase.reason}"
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        {purchase.intercepted ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            purchase.proceeded 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {purchase.proceeded ? 'Proceeded' : 'Prevented'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Direct
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
              
              <div className="space-y-4">
                {/* Cooldown Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cooldown Duration
                  </label>
                  <select
                    value={settings.cooldownSeconds}
                    onChange={(e) => handleSettingChange('cooldownSeconds', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>

                {/* Enable Nudges */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">AI Nudges</label>
                    <p className="text-xs text-gray-500">Get personalized purchase insights</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('enableNudges', !settings.enableNudges)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableNudges ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableNudges ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Scam Detection */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Scam Detection</label>
                    <p className="text-xs text-gray-500">Warn about suspicious websites</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('enableScamDetection', !settings.enableScamDetection)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableScamDetection ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableScamDetection ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>SpendGuard v1.0.0</p>
                <p>Built to help you make smarter purchase decisions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;