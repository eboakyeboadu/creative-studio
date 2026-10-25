export type ViewType = 'chat' | 'home' | 'plan' | 'analyze' | 'campaign' | 'presentation' | 'settings' | 'login' | 'signup' | 'review' | 'transcribe' | 'tasks' | 'calendar' | 'notifications' | 'focus' | 'ai-studio' | 'capabilities' | 'world-clock' | 'visualize' | 'storyboard' | 'tts' | 'image-gen' | 'translation';

export interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  status: 'todo' | 'completed';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  category?: string;
  folder?: string;
  dueDate?: Date;
  createdAt: Date;
  notified2h?: boolean;
  notified24h?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'task' | 'event' | 'system';
  priority: 'low' | 'medium' | 'high';
  relatedId?: string;
  view?: ViewType;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  link?: string;
  start: Date;
  end: Date;
  type: 'task' | 'meeting' | 'campaign' | 'other';
  status?: 'todo' | 'completed' | 'active';
  color?: string;
  relatedId?: string;
}

export interface StructuredTranscript {
  summary: string;
  keyPoints: string[];
  takeaways: string[];
  insights: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
  tempId?: string;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  timestamp: Date;
  language: string;
  fileName?: string;
  structured?: StructuredTranscript;
  isProcessing?: boolean;
  chatHistory?: ChatMessage[];
  isChatting?: boolean;
}

