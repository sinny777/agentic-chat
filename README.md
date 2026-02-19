# Carbon AI Chat Widget 🤖

A premium, state-of-the-art Agentic AI conversational chat widget built with **React**, **Vite**, and the **IBM Carbon Design System**. Designed for seamless embedding and deep developer customization.

![Carbon AI Chat](https://img.shields.io/badge/UI-IBM%20Carbon-blue)
![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)
![Agentic AI](https://img.shields.io/badge/AI-Agentic%20Flow-success)

## ✨ Key Features

### 🚀 Agentic Experience
- **Streaming Responses**: Real-time AI messaging for a fluid conversation.
- **Thinking States**: Visual feedback when the agent is processing or reasoning.
- **Tool Calling Visibility**: Transparent display of agent actions and tool results.
- **Rich Markdown**: Full support for markdown, code blocks, and structured responses.

### 🎨 Premium UI/UX
- **Carbon Design System**: Built following IBM's professional design language.
- **Rich Interactions**: Hover effects for feedback (thumbs-up/down) and copy-to-clipboard.
- **Modern Input Area**: Integrated buttons for **Document Upload** and **Voice Input (Microphone)**.
- **Dynamic Animations**: Smooth transitions and sleek micro-animations for a premium feel.

### 🛠 Developer-First Customization
- **Flexible Hooks**: `onLoad`, `onPreSendMessage`, `onPostSendMessage`, etc.
- **Media Extensions**: Hooks for `onDocumentUpload` and `onMicrophoneClick`.
- **Framework Support**: Seamless integration with **React**, **Angular**, and **Vue**.
- **Theme Support**: Runtime styling customization via a simple `theme` object.
- **CSS Overrides**: Fine-grained control using exposed CSS variables.

### 🔌 Robust Embedding
- **No-Collision Design**: Isolated styles to prevent conflicts with host pages.
- **Command Queue**: A robust stub/queue pattern ensures initialization works even if the script is still loading.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## 📦 How to Embed

Add the following snippet to your HTML to get started:

```javascript
// Robust Initialization Stub
window.CarbonChat = window.CarbonChat || { 
  _q: [], 
  init: function(cfg) { this._q.push(['init', cfg]); } 
};

window.CarbonChat.init({
  apiEndpoint: 'https://your-api.com/chat',
  theme: {
    primaryColor: '#0062ff'
  }
});
```

For detailed integration guides and API reference, see [DEVELOPER.md](./DEVELOPER.md).

## 📄 License
MIT
