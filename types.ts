export interface User {
  fullName: string;
  phoneNumber: string;
  isAdmin?: boolean;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface SystemPrompt {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  isActive: boolean;
}

export interface VoiceAgentSettings {
  voice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
  language: string;
  fallbackMessage: string;
}

export interface Session {
  id: string;
  user: User;
  startTime: Date;
  endTime?: Date;
  transcript: TranscriptMessage[];
}

export interface TranscriptMessage {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
}