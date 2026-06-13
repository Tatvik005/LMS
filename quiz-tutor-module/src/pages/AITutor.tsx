import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTutor } from '../context/TutorContext';
import { extractTextFromPDF } from '../lib/pdfParser';
import { 
  Send, Bot, User, FileText, UploadCloud, 
  Lightbulb, List, FileQuestion, Calendar 
} from 'lucide-react';

const INTENTS = [
  { id: 'explain', icon: <Lightbulb size={18} />, text: 'Explain Concept', prompt: 'Explain the concept of Binary Search Trees with examples.' },
  { id: 'mcq', icon: <FileQuestion size={18} />, text: 'Generate MCQs', prompt: "Give me 5 MCQs on Dijkstra's Algorithm with an answer key." },
  { id: 'notes', icon: <List size={18} />, text: 'Create Notes', prompt: 'Make bullet-point revision notes for OS Scheduling.' },
  { id: 'study_plan', icon: <Calendar size={18} />, text: 'Study Plan', prompt: 'Make a 7-day study plan for a DBMS exam.' },
];

export const AITutor: React.FC = () => {
  const { messages, isTyping, sendMessage } = useTutor();
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pdfContextText, setPdfContextText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() && !pdfContextText) return;
    
    let prompt = inputValue || "Summarize the attached document into key points, important definitions, and 5 likely exam questions.";
    
    sendMessage(prompt, pdfContextText || undefined);
    
    setInputValue('');
    setPdfContextText(null);
    setPdfFileName(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleIntentClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const extractedText = await extractTextFromPDF(file);
      setPdfContextText(extractedText);
      setPdfFileName(file.name);
      
      // Auto-send a summarization request upon upload
      sendMessage("Summarize the attached document into key points, important definitions, and 5 likely exam questions.", extractedText);
      setPdfContextText(null);
      setPdfFileName(null);
      
    } catch (error) {
      console.error(error);
      alert("Failed to read PDF. It might be corrupted or protected.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container py-4 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl mb-1">AI Teaching Assistant</h1>
          <p className="text-muted text-sm">Your personal tutor for concepts, notes, and study plans.</p>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-accent-secondary text-white' : 'bg-accent-primary text-white'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-accent-secondary/20 border border-accent-secondary/30 rounded-tr-none' 
                    : 'bg-slate-800/80 border border-slate-700 rounded-tl-none markdown-content'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                  <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="self-start flex gap-4 max-w-[85%]"
              >
                <div className="w-10 h-10 rounded-full bg-accent-primary text-white flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 rounded-tl-none flex gap-2 items-center h-12">
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          {/* Quick Intents */}
          <div className="flex flex-wrap gap-2 mb-4">
            {INTENTS.map(intent => (
              <button 
                key={intent.id}
                onClick={() => handleIntentClick(intent.prompt)}
                disabled={isTyping}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm transition disabled:opacity-50"
              >
                <span className="text-accent-secondary">{intent.icon}</span>
                {intent.text}
              </button>
            ))}
          </div>

          {pdfFileName && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-accent-primary/20 border border-accent-primary/30 rounded-md text-sm text-accent-primary">
              <FileText size={16} />
              {pdfFileName}
            </div>
          )}

          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              className={`btn-icon w-12 h-12 flex items-center justify-center shrink-0 border border-slate-700 bg-slate-800 transition ${isUploading ? 'animate-pulse opacity-50' : 'hover:bg-slate-700 text-accent-secondary'}`}
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF for Summarization"
              disabled={isUploading || isTyping}
            >
              <UploadCloud size={24} />
            </button>
            
            <textarea
              className="form-textarea min-h-[48px] h-12 flex-1 resize-none py-3"
              placeholder="Ask anything or upload a PDF to summarize..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping || isUploading}
            />
            
            <button 
              className="btn btn-primary w-12 h-12 p-0 flex items-center justify-center shrink-0 disabled:opacity-50"
              onClick={handleSend}
              disabled={(!inputValue.trim() && !pdfContextText) || isTyping || isUploading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
