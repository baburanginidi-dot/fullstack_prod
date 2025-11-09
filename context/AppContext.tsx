import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, KnowledgeDocument, SystemPrompt, VoiceAgentSettings } from '../types';

interface AppContextType {
  user: User | null;
  login: (user: User) => void;
  loginAsAdmin: () => void;
  logout: () => void;
  documents: KnowledgeDocument[];
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'uploadedAt'>) => void;
  prompts: SystemPrompt[];
  addPrompt: (prompt: Omit<SystemPrompt, 'id' | 'createdAt' | 'version' | 'isActive'>) => void;
  setActivePrompt: (id: string) => void;
  settings: VoiceAgentSettings;
  updateSettings: (newSettings: Partial<VoiceAgentSettings>) => void;
  activePrompt: SystemPrompt | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialPrompts: SystemPrompt[] = [
  { id: '1', version: 1, content: 'You are a helpful and friendly customer support agent. Address the user by their name.', createdAt: new Date(), isActive: true }
];

const initialSettings: VoiceAgentSettings = {
  voice: 'Zephyr',
  language: 'en-US',
  fallbackMessage: "I'm sorry, I didn't catch that. Could you please say that again?"
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [prompts, setPrompts] = useState<SystemPrompt[]>(initialPrompts);
  const [settings, setSettings] = useState<VoiceAgentSettings>(initialSettings);

  const login = (userData: User) => setUser({ ...userData, isAdmin: false });
  const loginAsAdmin = () => setUser({ fullName: 'Administrator', phoneNumber: '', isAdmin: true });
  const logout = () => setUser(null);

  const addDocument = (doc: Omit<KnowledgeDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: KnowledgeDocument = {
      ...doc,
      id: crypto.randomUUID(),
      uploadedAt: new Date(),
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const addPrompt = (prompt: Omit<SystemPrompt, 'id' | 'createdAt' | 'version' | 'isActive'>) => {
    const newPrompt: SystemPrompt = {
      ...prompt,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      version: prompts.length + 1,
      isActive: false
    };
    setPrompts(prev => [...prev, newPrompt]);
  };

  const setActivePrompt = (id: string) => {
    setPrompts(prompts.map(p => ({ ...p, isActive: p.id === id })));
  };

  const updateSettings = (newSettings: Partial<VoiceAgentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const activePrompt = prompts.find(p => p.isActive);

  return (
    <AppContext.Provider value={{ user, login, loginAsAdmin, logout, documents, addDocument, prompts, addPrompt, setActivePrompt, settings, updateSettings, activePrompt }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};