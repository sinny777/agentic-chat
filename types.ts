export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  THOUGHT = 'thought',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result'
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'calling' | 'success' | 'error';
  result?: string;
}

export interface Message {
  id: string;
  sender: Sender;
  type: MessageType;
  content: string;
  timestamp: number;
  toolData?: ToolCallData;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  input: string;
}
