import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ChatWidget from './components/ChatWidget';
import { agentService } from './services/agent_service';
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
const CarbonChatImpl = {
  init: (config: {
    apiKey?: string;
    containerId?: string;
    apiEndpoint?: string;
    modelId?: string;
    onLoad?: () => Promise<any> | any;
    onDocumentUpload?: () => void;
    onMicrophoneClick?: () => void;
    theme?: {
      primaryColor?: string;
      fontFamily?: string;
      headerBackground?: string;
      headerText?: string;
      windowBackground?: string;
      bodyBackground?: string;
      userBubbleBackground?: string;
      userBubbleText?: string;
      aiBubbleBackground?: string;
      aiBubbleText?: string;
    };
  } = {}) => {
    // 0. Update Agent Configuration
    agentService.setConfig({
      apiEndpoint: config.apiEndpoint,
      modelId: config.modelId
    });

    // 0.1 Apply Theme if provided
    if (config.theme) {
      const root = document.documentElement;
      const t = config.theme;
      if (t.primaryColor) root.style.setProperty('--carbon-chat-primary-color', t.primaryColor);
      if (t.fontFamily) root.style.setProperty('--carbon-chat-font-family', t.fontFamily);
      if (t.headerBackground) root.style.setProperty('--carbon-chat-header-bg', t.headerBackground);
      if (t.headerText) root.style.setProperty('--carbon-chat-header-text', t.headerText);
      if (t.windowBackground) root.style.setProperty('--carbon-chat-window-bg', t.windowBackground);
      if (t.bodyBackground) root.style.setProperty('--carbon-chat-body-bg', t.bodyBackground);
      if (t.userBubbleBackground) root.style.setProperty('--carbon-chat-user-bubble-bg', t.userBubbleBackground);
      if (t.userBubbleText) root.style.setProperty('--carbon-chat-user-bubble-text', t.userBubbleText);
      if (t.aiBubbleBackground) root.style.setProperty('--carbon-chat-ai-bubble-bg', t.aiBubbleBackground);
      if (t.aiBubbleText) root.style.setProperty('--carbon-chat-ai-bubble-text', t.aiBubbleText);
    }

    // 1. Check if already mounted
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
        <ChatWidget
          onLoad={config.onLoad}
          onPreSendMessage={config.onPreSendMessage}
          onPostSendMessage={config.onPostSendMessage}
          onDocumentUpload={config.onDocumentUpload}
          onMicrophoneClick={config.onMicrophoneClick}
        />
      </React.StrictMode>
    );
  }
};

// Handle command queue if it exists
const existingChat = (window as any).CarbonChat;
if (existingChat && existingChat._q) {
  const queue = existingChat._q;
  // Replace stub with real implementation
  (window as any).CarbonChat = CarbonChatImpl;
  // Process queued commands
  queue.forEach((args: any) => {
    if (args[0] === 'init') {
      CarbonChatImpl.init(args[1]);
    }
  });
} else {
  (window as any).CarbonChat = CarbonChatImpl;
}

// Auto-init if a specific script tag attribute is present
const currentScript = document.currentScript;
if (currentScript && currentScript.getAttribute('data-auto-init') === 'true') {
  (window as any).CarbonChat.init();
}