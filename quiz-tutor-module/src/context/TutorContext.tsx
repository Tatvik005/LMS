import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ChatMessage } from '../types';
import { generateTutorResponse } from '../lib/gemini';

interface TutorContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (content: string, pdfContext?: string) => Promise<void>;
  clearHistory: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tutor_chat_history');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: 'Hello! I am your AI Teaching Assistant. How can I help you today? You can ask me to explain concepts, generate MCQs, create study notes, or even upload a PDF for me to summarize.',
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tutor_chat_history', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (content: string, pdfContext?: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const aiResponse = await generateTutorResponse(content, pdfContext);
      
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
    <TutorContext.Provider value={{ messages, isTyping, sendMessage, clearHistory }}>
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const context = useContext(TutorContext);
  if (!context) throw new Error('useTutor must be used within a TutorProvider');
  return context;
};
