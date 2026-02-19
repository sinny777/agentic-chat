import React, { useState, useEffect, useRef } from 'react';
import {
  Chat,
  Close,
  Send,
  Bot,
  Settings,
  Code,
  ChevronDown,
  Renew,
  Upload,
  Microphone,
  ThumbsUp,
  ThumbsDown,
  Copy
} from '@carbon/icons-react';
import { Button, TextInput, IconButton, Theme } from '@carbon/react';
import MarkdownRenderer from './MarkdownRenderer';
import { agentService } from '../services/agent_service';
import { Message, MessageType, Sender } from '../types';

interface ChatWidgetProps {
  onLoad?: () => Promise<any> | any;
  onPreSendMessage?: (input: string) => Promise<string | null> | string | null;
  onPostSendMessage?: (userMessage: Message, aiResponse: Message) => void;
  onDocumentUpload?: () => void;
  onMicrophoneClick?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  onLoad,
  onPreSendMessage,
  onPostSendMessage,
  onDocumentUpload,
  onMicrophoneClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const initChat = async () => {
    setIsLoading(true);
    try {
      let context = {};
      if (onLoad) {
        context = await onLoad();
      }

      // Initial hidden prompt to trigger welcome message
      let hiddenPrompt = "Hello";

      if (context && 'ci_id' in context) {
        hiddenPrompt = "This is the first chat conversation with user for Client Interest Id: " + context.ci_id + ". User has clicked on the link sent via email and now you need to help user with their queries on IBM products, trials and demos.";
      }

      // We don't add the hidden prompt to the messages list so the user doesn't see it (or we can adding it as a hidden system msg if needed, but requirements imply just getting the response). 
      // However, streamChat expects history. If history is empty, it's a new chat.

      const stream = agentService.streamChat([], hiddenPrompt, context);

      for await (const chunk of stream) {
        setMessages(prev => {
          // Reuse the logic from handleSendMessage or refactor it into a helper.
          // For now, I'll duplicate the update logic slightly for simplicity or better yet, extract the updater.
          // Actually, let's keep it consistent.

          const lastMsg = prev[prev.length - 1];

          // Case 1: Finish signal
          if (!chunk.isStreaming && chunk.content === '' && chunk.type === MessageType.TEXT && chunk.id === 'final_finish') {
            if (lastMsg && lastMsg.sender === Sender.AI) {
              return [...prev.slice(0, -1), { ...lastMsg, isStreaming: false }];
            }
            return prev;
          }

          // Case 2: Streaming update
          if (chunk.isStreaming) {
            if (lastMsg && lastMsg.sender === Sender.AI && lastMsg.isStreaming && lastMsg.type === chunk.type) {
              return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk.content }];
            }
          }

          // Case 3: New message
          if (lastMsg && lastMsg.isStreaming) {
            return [...prev.slice(0, -1), { ...lastMsg, isStreaming: false }, chunk];
          }

          return [...prev, chunk];
        });
      }
    } catch (error) {
      console.error("Init chat error:", error);
      // Fallback or error state
      setMessages([{
        id: 'init_error',
        sender: Sender.AI,
        type: MessageType.TEXT,
        content: "Hello! I'm ready to help. (Connection issue detected during initialization)",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      initChat();
    }
  }, []); // Run once on mount

  const handleRestart = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    // initChat will be triggered by the effect because messages became empty? 
    // Actually no, dependency is empty array [], so it only runs on mount. 
    // We should call initChat directly here or add messages.length to dependency but that might cause loops.
    // Better to call initChat explicitely.
    setTimeout(initChat, 0);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Additional timeout to catch layout shifts
      setTimeout(scrollToBottom, 150);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let processedInput = input;
    if (onPreSendMessage) {
      const result = await onPreSendMessage(input);
      if (result === null) return;
      processedInput = result;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      type: MessageType.TEXT,
      content: processedInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let fullAiResponse = "";
    let finalAiMsg: Message | null = null;

    try {
      const stream = agentService.streamChat(messages, input);

      for await (const chunk of stream) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];

          // Case 1: Finish signal
          if (!chunk.isStreaming && chunk.content === '' && chunk.type === MessageType.TEXT && chunk.id === 'final_finish') {
            if (lastMsg && lastMsg.sender === Sender.AI) {
              return [...prev.slice(0, -1), { ...lastMsg, isStreaming: false }];
            }
            return prev;
          }

          // Case 2: Streaming update (Text or Thought)
          if (chunk.isStreaming) {
            // Check if we can merge with the last message of the same type
            if (lastMsg && lastMsg.sender === Sender.AI && lastMsg.isStreaming && lastMsg.type === chunk.type) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk.content }
              ];
            }
          }

          // Case 3: New message (Streaming or Discrete) - either type changed or discrete event
          // If the previous message was streaming, mark it as finished
          if (lastMsg && lastMsg.isStreaming) {
            const updatedLast = { ...lastMsg, isStreaming: false };
            finalAiMsg = chunk;
            return [
              ...prev.slice(0, -1),
              updatedLast,
              chunk
            ];
          }

          finalAiMsg = chunk;
          return [...prev, chunk];
        });

        if (chunk.type === MessageType.TEXT) {
          fullAiResponse += chunk.content;
        }
      }

      if (onPostSendMessage && finalAiMsg) {
        onPostSendMessage(userMsg, finalAiMsg);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: Sender.SYSTEM,
        type: MessageType.TEXT,
        content: "System Error: Unable to reach the agent.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="carbon-chat-widget">

      {/* Chat Window */}
      {isOpen && (
        <div className="carbon-chat-window">

          {/* Header */}
          <div className="carbon-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Agent Assistant</span>
                {/* <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Powered by IBM</span> */}
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <Button
                hasIconOnly
                renderIcon={Renew}
                kind="ghost"
                size="sm"
                iconDescription="Restart Chat"
                onClick={handleRestart}
                className="close-chat-btn"
                style={{ color: 'white' }}
              />
              <Button
                hasIconOnly
                renderIcon={Close}
                kind="ghost"
                size="sm"
                iconDescription="Close Chat"
                onClick={toggleChat}
                className="close-chat-btn"
                style={{ color: 'white' }}
              />
            </div>
          </div>

          {/* Messages Area */}
          <div className="carbon-chat-body">
            {groupMessages(messages).map((item, idx, arr) => {
              if (Array.isArray(item)) {
                return <ActionGroup key={item[0].id + '_group'} messages={item} isLoading={isLoading && idx === arr.length - 1} />;
              }
              return <MessageBubble key={item.id + idx} message={item} />;
            })}
            {isLoading && messages[messages.length - 1]?.sender === Sender.USER && (
              <div style={{ padding: '0.5rem', opacity: 0.5, fontSize: '0.75rem' }}>
                Agent is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="carbon-chat-input-area">
            <IconButton
              renderIcon={Upload}
              kind="ghost"
              label="Upload documents"
              size="lg"
              disabled={isLoading}
              onClick={onDocumentUpload}
            />
            <div className="chat-input-wrapper">
              <TextInput
                id="chat-input"
                labelText=""
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                hideLabel
                size="lg"
              />
              <IconButton
                renderIcon={Microphone}
                kind="ghost"
                label="Voice input"
                size="lg"
                disabled={isLoading}
                onClick={onMicrophoneClick}
              />
            </div>
            <IconButton
              renderIcon={Send}
              kind="ghost"
              label="Send"
              disabled={!input.trim() || isLoading}
              onClick={handleSendMessage}
              size="lg"
            />
          </div>

          {/* Footer Branding */}
          {/* <div style={{ padding: '0.25rem', textAlign: 'center', backgroundColor: '#f4f4f4', fontSize: '0.625rem', color: '#6f6f6f' }}>
            IBM Carbon Design System • Agentic AI
          </div> */}
        </div>
      )}

      {/* Launcher Button */}
      <Button
        renderIcon={isOpen ? Close : Chat}
        iconDescription={isOpen ? "Close Chat" : "Open Chat"}
        hasIconOnly
        onClick={toggleChat}
        size="2xl" // Custom or max size

      />
    </div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const isSystem = message.sender === Sender.SYSTEM;
  const [isExpanded, setIsExpanded] = useState(true);

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0', width: '100%' }}>
        <span style={{ fontSize: '0.75rem', color: '#da1e28', padding: '0.5rem', background: '#fff1f1', border: '1px solid #ffccd1' }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      justifyContent: isUser ? 'flex-end' : 'flex-start'
    }}>
      <div
        className={isUser ? "carbon-chat-bubble carbon-chat-bubble--user" : "carbon-chat-bubble carbon-chat-bubble--ai"}
      >
        {message.sender === Sender.AI && (
          <div className="carbon-chat-timestamp">
            <span>Assistant</span> • <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {isUser ? (
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            <div className="carbon-chat-message-actions">
              <IconButton
                renderIcon={ThumbsUp}
                kind="ghost"
                label="Helpful"
                size="sm"
                className="feedback-btn"
              />
              <IconButton
                renderIcon={ThumbsDown}
                kind="ghost"
                label="Not helpful"
                size="sm"
                className="feedback-btn"
              />
              <IconButton
                renderIcon={Copy}
                kind="ghost"
                label="Copy to clipboard"
                size="sm"
                className="feedback-btn"
                onClick={() => navigator.clipboard.writeText(message.content)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper to group messages
const groupMessages = (messages: Message[]) => {
  const groups: (Message | Message[])[] = [];
  let currentGroup: Message[] = [];

  messages.forEach((msg) => {
    if (
      msg.type === MessageType.THOUGHT ||
      msg.type === MessageType.TOOL_CALL ||
      msg.type === MessageType.TOOL_RESULT
    ) {
      currentGroup.push(msg);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
      groups.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groups.push([...currentGroup]);
  }

  return groups;
};

// Grouped Action Component
const ActionGroup: React.FC<{ messages: Message[], isLoading?: boolean }> = ({ messages, isLoading }) => {
  const isStreaming = messages.some(m => m.isStreaming);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastMsg = messages[messages.length - 1];

  // Determine status text
  let statusText = "Agent Actions";

  if (isStreaming || isLoading) {
    const activeMsg = messages.find(m => m.isStreaming) || lastMsg;

    if (activeMsg.type === MessageType.THOUGHT) {
      statusText = "Thinking...";
    } else if (activeMsg.type === MessageType.TOOL_CALL) {
      statusText = `Executing: ${activeMsg.toolData?.name || 'Tool'}`;
    } else if (activeMsg.type === MessageType.TOOL_RESULT) {
      statusText = "Thinking...";
    } else {
      statusText = "Running...";
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: '0.5rem 0', width: '100%' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.625rem', color: '#6f6f6f', textTransform: 'uppercase', letterSpacing: '0.05rem',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0
        }}
      >
        <div style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
          <ChevronDown size={12} />
        </div>
        <Settings size={12} />
        <span>{statusText}</span>
        {!isStreaming && <span style={{ marginLeft: 'auto', fontSize: '0.625rem', opacity: 0.5 }}>
          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>}
      </button>

      {isExpanded && (
        <div style={{ borderLeft: '2px solid #e0e0e0', paddingLeft: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map((msg, idx) => (
            <div key={msg.id + idx}>
              {msg.type === MessageType.THOUGHT && (
                <div style={{ fontSize: '0.75rem', color: '#525252', fontFamily: '"IBM Plex Mono", monospace' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.625rem', color: '#8d8d8d' }}>REASONING PROCESS</div>
                  <div className="prose prose-sm max-w-none text-xs">
                    {msg.content}
                    {msg.isStreaming && <span style={{ display: 'inline-block', width: '4px', height: '12px', background: '#8d8d8d', marginLeft: '4px' }}></span>}
                  </div>
                </div>
              )}
              {msg.type === MessageType.TOOL_CALL && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.625rem', color: '#8a3ffc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Code size={10} /> AGENT ACTION
                  </div>
                  <div style={{ background: '#f4f4f4', padding: '0.5rem', borderLeft: '2px solid #8a3ffc' }}>
                    <div style={{ fontWeight: 'bold', color: '#6929c4', marginBottom: '0.25rem' }}>{msg.toolData?.name}</div>
                    <pre style={{ margin: 0, overflowX: 'auto' }}>{JSON.stringify(msg.toolData?.args, null, 2)}</pre>
                  </div>
                </div>
              )}
              {msg.type === MessageType.TOOL_RESULT && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.625rem', color: '#005d5d' }}>OUTPUT RECEIVED</div>
                  <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', padding: '0.5rem', borderLeft: '2px solid #009d9a', overflowX: 'auto', maxHeight: '160px' }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;