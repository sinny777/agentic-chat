import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ChatWidget from './components/ChatWidget';
import './styles.scss';

// 1. Dev/Demo Mode: Mounts full App if #root exists
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// 2. Embeddable Widget Mode
// Expose a global API to mount the widget on any page
(window as any).CarbonChat = {
  init: (config: { apiKey?: string; containerId?: string } = {}) => {
    // Check if already mounted
    if (document.getElementById('carbon-chat-widget-mount')) {
      console.warn('Carbon Chat Widget is already mounted.');
      return;
    }

    // 2. Create Mount Point
    const mountId = 'carbon-chat-widget-mount';
    const mountPoint = document.createElement('div');
    mountPoint.id = mountId;
    document.body.appendChild(mountPoint);

    // 3. Mount Widget
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <ChatWidget />
      </React.StrictMode>
    );
  }
};

// Auto-init if a specific script tag attribute is present
const currentScript = document.currentScript;
if (currentScript && currentScript.getAttribute('data-auto-init') === 'true') {
  (window as any).CarbonChat.init();
}