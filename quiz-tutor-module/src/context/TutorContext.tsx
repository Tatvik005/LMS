import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ChatMessage } from '../types';
import { generateTutorResponse, type FileData } from '../lib/gemini';

interface TutorContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  activeFileName: string | null;
  activeFileData: FileData | null;
  setActiveDocument: (fileData: FileData, fileName: string) => void;
  clearActiveDocument: () => void;
  sendMessage: (content: string, overrideFileData?: FileData) => Promise<void>;
  clearHistory: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeFileData, setActiveFileData] = useState<FileData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tutor_chat_history');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: 'Hello! I am your AI Teaching Assistant. How can I help you today? You can ask me to explain concepts, generate MCQs, create study notes, or even upload a document for me to summarize.',
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tutor_chat_history', JSON.stringify(messages));
  }, [messages]);

  const setActiveDocument = (fileData: FileData, fileName: string) => {
    setActiveFileData(fileData);
    setActiveFileName(fileName);
  };

  const clearActiveDocument = () => {
    setActiveFileData(null);
    setActiveFileName(null);
  };

  const sendMessage = async (content: string, overrideFileData?: FileData) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const fileToSend = overrideFileData || activeFileData;
      const aiResponse = await generateTutorResponse(content, messages, fileToSend || undefined);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in TutorContext sendMessage", error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    const initialMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'ai',
      content: 'Chat history cleared. How can I help you?',
      timestamp: new Date().toISOString()
    };
    setMessages([initialMsg]);
  };

  return (
    <TutorContext.Provider value={{ 
      messages, 
      isTyping, 
      activeFileName, 
      activeFileData, 
      sendMessage, 
      clearHistory, 
      setActiveDocument, 
      clearActiveDocument 
    }}>
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const context = useContext(TutorContext);
  if (!context) throw new Error('useTutor must be used within a TutorProvider');
  return context;
};
