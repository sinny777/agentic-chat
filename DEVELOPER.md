# Developer Guide: Customizing the Chat Widget

This guide explains how to embed and customize the Carbon Chat Widget in your web application.

## Embedding the Widget

Add the following script tag to your HTML to load the widget:

```html
<script src="path/to/carbon-chat.js"></script>
```

## Initialization & Customization

To ensure the widget initializes correctly even if the script hasn't fully loaded, use the following robust snippet. This pattern creates a command queue that the widget will process once it's ready.

```javascript
// 1. Define the Stub/Queue (prevents "undefined" errors)
window.CarbonChat = window.CarbonChat || { 
  _q: [], 
  init: function(cfg) { this._q.push(['init', cfg]); } 
};

// 2. Call Initialization
window.CarbonChat.init({
  onLoad: async () => {
    console.log("Chat widget loaded");
    return { user_id: '123' };
  },
  onPreSendMessage: async (message) => {
    return message;
  },
  onPostSendMessage: (userMessage, aiResponse) => {
    console.log("Done!");
  }
});
```

## Configuration Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `apiEndpoint` | `string` | The URL of your agent's backend endpoint (e.g., `/chat/completions`). |
| `modelId` | `string` | Optional model ID to use for the interaction. |
| `onLoad` | `() => any` | Executed on mount. Can return data used as initial context. |
| `onPreSendMessage` | `(msg: string) => string \| null` | Hook to process/modify messages. Return `null` to abort sending. |
| `onPostSendMessage`| `(userMsg, aiMsg) => void` | Callback after message exchange completes. |
| `onDocumentUpload` | `() => void` | Callback when the document upload button is clicked. |
| `onMicrophoneClick`| `() => void` | Callback when the microphone button is clicked. |
| `theme`            | `object`     | Object to override default CSS variables. |

## Styling & Customization

You can customize the appearance of the chat widget using the `theme` configuration object in `init()`. This allows you to match the widget with your application's brand.

```javascript
window.CarbonChat.init({
  theme: {
    primaryColor: '#0062ff',          // Main brand color
    headerBackground: '#161616',      // Background of the chat header
    headerText: '#ffffff',            // Text color for the header
    windowBackground: '#ffffff',      // Background of the overall chat window
    bodyBackground: '#f4f4f4',        // Background of the message area
    userBubbleBackground: '#0062ff',   // User message bubble color
    userBubbleText: '#ffffff',        // User message text color
    aiBubbleBackground: '#e0e0e0',     // AI message bubble color
    aiBubbleText: '#161616',           // AI message text color
    fontFamily: '"IBM Plex Sans", sans-serif'
  }
});
```

### CSS Variables Overrides

If you prefer to use CSS, you can override the variables directly in your styles:

```css
:root {
  --carbon-chat-primary-color: #0062ff;
  --carbon-chat-header-bg: #161616;
  --carbon-chat-font-family: 'Inter', sans-serif;
}
```

## Framework Integration

The Carbon Chat Widget can be easily integrated into Modern single-page applications (SPAs).

### React Integration

In a React application, it's best to wrap the initialization in a `useEffect` hook. This ensures the widget is mounted correctly and cleaned up if needed.

```tsx
import React, { useEffect } from 'react';

const ChatWidget = () => {
  useEffect(() => {
    // 1. Ensure global stub is present (if loaded via script tag)
    // Or you can directly use window.CarbonChat if defined
    if (window.CarbonChat) {
      window.CarbonChat.init({
        apiEndpoint: 'http://localhost:8000/chat/completions',
        onLoad: () => console.log('Widget Ready'),
        theme: {
          primaryColor: '#0062ff'
        }
      });
    }
  }, []);

  return null; // The widget mounts itself to document.body
};

export default ChatWidget;
```

### Angular Integration

In Angular, you can initialize the widget within the `ngOnInit` lifecycle hook of a core component (e.g., `AppComponent`).

```typescript
import { Component, OnInit } from '@angular/core';

// Tell TypeScript about the global CarbonChat object
declare global {
  interface Window {
    CarbonChat: any;
  }
}

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  ngOnInit() {
    if (window.CarbonChat) {
      window.CarbonChat.init({
        apiEndpoint: 'http://localhost:8000/chat/completions',
        onDocumentUpload: () => this.handleUpload(),
        theme: {
          fontFamily: 'Roboto, sans-serif'
        }
      });
    }
  }

  handleUpload() {
    console.log('Document upload requested from Angular');
  }
}
```

> [!TIP]
> Make sure to include the widget's JS and CSS files in your `angular.json` scripts/styles arrays or via `<script>` tags in `index.html`.
