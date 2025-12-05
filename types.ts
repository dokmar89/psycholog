export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; // The spoken text
  rationale?: string; // The internal reasoning (only for model)
  timestamp: number;
}

export interface ChatSession {
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  lastActive: number;
}

export type LoadingState = 'idle' | 'thinking' | 'streaming';