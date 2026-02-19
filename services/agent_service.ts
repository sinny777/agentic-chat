import { Message, Sender, MessageType, ToolCallData } from '../types';

// Configuration for the API Endpoint
const API_ENDPOINT = 'http://localhost:8080/chat/completions';
const MODEL_ID = 'meta-llama/llama-4-maverick-17b-128e-instruct-fp8';

// TOGGLE MOCK MODE
const USE_MOCK_DATA = false;

export class AgentService {
  private threadId: string;

  constructor() {
    this.threadId = crypto.randomUUID();
  }

  private mapHistoryToApiMessages(history: Message[]) {
    const apiMessages: any[] = [];

    for (const msg of history) {
      if (msg.sender === Sender.USER) {
        apiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.sender === Sender.AI && msg.type === MessageType.TEXT) {
        if (msg.content) apiMessages.push({ role: 'assistant', content: msg.content });
      } else if (msg.sender === Sender.AI && msg.type === MessageType.TOOL_CALL && msg.toolData) {
        apiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: msg.toolData.id,
            type: 'function',
            function: { name: msg.toolData.name, arguments: msg.toolData.args }
          }]
        });
      } else if (msg.type === MessageType.TOOL_RESULT && msg.toolData) {
        apiMessages.push({
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolData.id
        });
      }
    }
    return apiMessages;
  }

  // --- MOCK GENERATOR ---
  async *streamMockResponse(userMessage: string, context?: any): AsyncGenerator<Message> {
    const now = Date.now();

    // 1. Tool Call: fetch_previous_context
    const callId1 = `call_${now}_1`;
    yield {
      id: callId1,
      sender: Sender.AI,
      type: MessageType.TOOL_CALL,
      content: 'Executing tool: fetch_previous_context',
      timestamp: now,
      toolData: {
        id: callId1,
        name: 'fetch_previous_context',
        args: { ci_id: 'a0wgR000002KQtlABC' },
        status: 'calling'
      }
    };
    await new Promise(r => setTimeout(r, 800));

    // 2. Tool Result
    yield {
      id: `res_${now}_1`,
      sender: Sender.AI,
      type: MessageType.TOOL_RESULT,
      content: "## Client Interest Data: \n{'ID': 'a0wgR000002KQtlABC', 'ACCOUNT_NAME': 'ABC Company', 'ASSET_NAME': \"IBM AI agents and assistants buyer's guide\", 'COMPANY': 'ABC Company'}",
      timestamp: now + 1000,
      toolData: {
        id: callId1,
        name: 'fetch_previous_context',
        args: {},
        status: 'success',
        result: 'Success'
      }
    };
    await new Promise(r => setTimeout(r, 600));

    // 3. Thinking (Streaming)
    const thoughts = "The user has accessed the link to the IBM AI agents and assistants buyer's guide. I need to understand their current query or requirement related to this resource. I'll start by acknowledging their interest and asking how I can assist them further.";
    const thoughtChunks = thoughts.split(' ');

    // Initial thought chunk to verify type
    yield {
      id: `think_${now}`,
      sender: Sender.AI,
      type: MessageType.THOUGHT,
      content: "",
      timestamp: now + 1600,
      isStreaming: true
    };

    for (const chunk of thoughtChunks) {
      yield {
        id: `think_${now}`,
        sender: Sender.AI,
        type: MessageType.THOUGHT,
        content: chunk + " ",
        timestamp: now + 1600,
        isStreaming: true
      };
      await new Promise(r => setTimeout(r, 50)); // Fast stream
    }
    await new Promise(r => setTimeout(r, 600));

    // 4. Tool Call: search_ibm_content
    const callId2 = `call_${now}_2`;
    yield {
      id: callId2,
      sender: Sender.AI,
      type: MessageType.TOOL_CALL,
      content: 'Executing tool: search_ibm_content',
      timestamp: now + 3000,
      toolData: {
        id: callId2,
        name: 'search_ibm_content',
        args: { query: "IBM AI agents and assistants buyer's guide" },
        status: 'calling'
      }
    };
    await new Promise(r => setTimeout(r, 1500));

    // 5. Tool Result
    yield {
      id: `res_${now}_2`,
      sender: Sender.AI,
      type: MessageType.TOOL_RESULT,
      content: "### Search Results\n\n**IBM AI agents and assistants: The complete 2025 buyer's guide**\nDiscover how AI agents and assistants can transform your business operations. This comprehensive guide covers the latest trends, benefits, and implementation strategies.",
      timestamp: now + 4500,
      toolData: {
        id: callId2,
        name: 'search_ibm_content',
        args: {},
        status: 'success',
        result: 'Found 2 documents'
      }
    };
    await new Promise(r => setTimeout(r, 800));

    // 6. Final Response
    const response = "Hi there! Welcome. \n\nI see you're looking at the **IBM AI agents and assistants 2025 buyer's guide**. \n\nThis resource provides great insights into leveraging AI tools for business success. \n\nHow can I help you regarding this? Are you looking for specific implementation details or general benefits?";
    const words = response.split(/(?=[ \n])/);

    yield {
      id: `msg_${now}`,
      sender: Sender.AI,
      type: MessageType.TEXT,
      content: "",
      timestamp: now + 5500,
      isStreaming: true
    };

    for (const word of words) {
      yield {
        id: `msg_${now}`,
        sender: Sender.AI,
        type: MessageType.TEXT,
        content: word,
        timestamp: now + 5500,
        isStreaming: true
      };
      await new Promise(r => setTimeout(r, 30));
    }

    // Finish
    yield {
      id: 'final_finish',
      sender: Sender.AI,
      type: MessageType.TEXT,
      content: '',
      timestamp: Date.now(),
      isStreaming: false
    };
  }

  async *streamChat(history: Message[], newMessage: string, context: any = {}): AsyncGenerator<Message> {
    if (USE_MOCK_DATA) {
      yield* this.streamMockResponse(newMessage, context);
      return;
    }

    const apiMessages = this.mapHistoryToApiMessages(history);
    apiMessages.push({ role: 'user', content: newMessage });

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-API-Key': '7a3B#dK9L2pM4nR5t6U7vW8xY9z0A1B2C3D4E5F6G7H8I9J0'
        },
        body: JSON.stringify({
          model: MODEL_ID,
          context: context,
          messages: apiMessages,
          stream: true,
          extra_body: { thread_id: this.threadId }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/(?:\n\n|\r\n\r\n)/);
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split(/\r?\n/);
          let eventType = '';
          let data: any = null;
          let id = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.substring(7).trim();
            else if (line.startsWith('data: ')) {
              try { data = JSON.parse(line.substring(6)); } catch (e) { }
            }
            else if (line.startsWith('id: ')) id = line.substring(4).trim();
          }

          if (!data) continue;

          if (eventType === 'thread.run.step.delta') {
            const delta = data.choices?.[0]?.delta;
            const stepDetails = delta?.step_details;

            if (stepDetails?.type === 'tool_calls') {
              for (const tool of stepDetails.tool_calls || []) {
                if (tool.name === 'think') continue;
                const uniqueId = tool.id || id || `tool_${Date.now()}`;
                yield {
                  id: uniqueId,
                  sender: Sender.AI,
                  type: MessageType.TOOL_CALL,
                  content: `Executing tool: ${tool.name}`,
                  timestamp: Date.now(),
                  toolData: { id: tool.id || uniqueId, name: tool.name, args: tool.args || {}, status: 'calling' }
                };
              }
            } else if (stepDetails?.type === 'tool_response') {
              if (stepDetails.name === 'think') continue;
              yield {
                id: (stepDetails.tool_call_id || id) + '_res',
                sender: Sender.AI,
                type: MessageType.TOOL_RESULT,
                content: stepDetails.content || '',
                timestamp: Date.now(),
                toolData: { id: stepDetails.tool_call_id, name: stepDetails.name, args: {}, status: 'success', result: stepDetails.content }
              };
            }
          } else if (eventType === 'thread.message.delta') {
            const delta = data.choices?.[0]?.delta;
            const content = delta?.content;

            if (typeof content === 'string') {
              yield {
                id: id || 'streaming_text',
                sender: Sender.AI,
                type: MessageType.TEXT,
                content: content,
                timestamp: Date.now(),
                isStreaming: true
              };
            } else if (typeof content === 'object' && content.type === 'thinking') {
              yield {
                id: id || 'streaming_thought',
                sender: Sender.AI,
                type: MessageType.THOUGHT,
                content: content.content || '',
                timestamp: Date.now(),
                isStreaming: true
              };
            }
          }
        }
      }
      yield {
        id: 'final_finish',
        sender: Sender.AI,
        type: MessageType.TEXT,
        content: '',
        timestamp: Date.now(),
        isStreaming: false
      };

    } catch (error: any) {
      console.error("Streaming error:", error);
      yield {
        id: `error_${Date.now()}`,
        sender: Sender.SYSTEM,
        type: MessageType.TEXT,
        content: `Error connecting to agent: ${error.message}. (Switched to Mock Mode in code to see demo)`,
        timestamp: Date.now()
      };
    }
  }
}

export const agentService = new AgentService();