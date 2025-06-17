import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './popup/Popup';
import './popup/Popup.css';

/**
 * Entry point for WebAssistant popup UI
 * Renders the main Popup component into the DOM
 */

// Ensure the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('WebAssistant: Root element not found');
    return;
  }

  // Create React root and render the Popup component
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
});

// Handle any unhandled errors
window.addEventListener('error', (event) => {
  console.error('WebAssistant popup error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('WebAssistant popup unhandled promise rejection:', event.reason);
});