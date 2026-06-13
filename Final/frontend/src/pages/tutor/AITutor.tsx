import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTutor } from '../../context/TutorContext';
import { 
  Send, Bot, User, FileText, UploadCloud, 
  Lightbulb, List, FileQuestion, Calendar 
} from 'lucide-react';

export const AITutor: React.FC = () => {
  const { messages, isTyping, sendMessage, activeFileName, activeFileData, setActiveDocument, clearActiveDocument } = useTutor();
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getDynamicPrompt = (baseAction: string) => {
    if (inputValue.trim()) {
      return `${baseAction} based on this topic: ${inputValue}`;
    }
    if (activeFileName) {
      return `${baseAction} based on the attached document ${activeFileName}.`;
    }
    if (messages.length > 1) {
       return `${baseAction} based on the topic we are currently discussing.`;
    }
    return `${baseAction} for a general topic of your choice.`;
  };

  const INTENTS = [
    { id: 'explain', icon: <Lightbulb size={18} />, text: 'Explain Concept', 
      prompt: getDynamicPrompt('Explain the key concepts') },
    { id: 'mcq', icon: <FileQuestion size={18} />, text: 'Generate MCQs', 
      prompt: getDynamicPrompt('Generate 5 MCQs with an answer key') },
    { id: 'notes', icon: <List size={18} />, text: 'Create Notes', 
      prompt: getDynamicPrompt('Make bullet-point revision notes') },
    { id: 'study_plan', icon: <Calendar size={18} />, text: 'Study Plan', 
      prompt: getDynamicPrompt('Create a comprehensive study plan') },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() && !activeFileName) return;
    
    let prompt = inputValue || "Summarize the attached document into key points, important definitions, and 5 likely exam questions.";
    
    sendMessage(prompt);
    
    setInputValue('');
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
    if (!file) return;

    e.target.value = '';
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        if (!reader.result) return;
        
        const resultStr = reader.result as string;
        const commaIdx = resultStr.indexOf(',');
        const base64String = commaIdx !== -1 ? resultStr.substring(commaIdx + 1) : resultStr;
        
        const fileData = { mimeType: file.type || 'application/pdf', data: base64String };
        
        setActiveDocument(fileData, file.name);
        
        sendMessage(`Please review the attached document: ${file.name}. Summarize it into key points, important definitions, and a few likely exam questions if applicable.`, fileData);
      } catch (err) {
        console.error("File processing error:", err);
        sendMessage(`I encountered a local error while preparing the file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("FileReader error:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
      <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">AI Teaching Assistant</h1>
        <p className="text-gray-500">Your personal tutor for concepts, notes, and study plans.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-gray-50">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none prose prose-indigo max-w-none'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                  <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
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
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-tl-none flex gap-2 items-center h-12 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-gray-100 bg-white">
          {/* Quick Intents */}
          <div className="flex flex-wrap gap-2 mb-4">
            {INTENTS.map(intent => (
              <button 
                key={intent.id}
                onClick={() => handleIntentClick(intent.prompt)}
                disabled={isTyping}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm text-gray-700 transition disabled:opacity-50"
              >
                <span className="text-indigo-600">{intent.icon}</span>
                {intent.text}
              </button>
            ))}
          </div>

          {activeFileName && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-700">
              <FileText size={16} />
              {activeFileName}
              <button 
                onClick={clearActiveDocument}
                className="ml-2 text-indigo-400 hover:text-indigo-700 transition"
                title="Remove attached document"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input 
              id="tutor-file-upload"
              type="file" 
              accept=".pdf,.txt,.md,.csv,.jpg,.jpeg,.png,.doc,.docx" 
              className="hidden" 
              onChange={handleFileUpload}
            />
            
            <label 
              htmlFor="tutor-file-upload"
              className={`cursor-pointer h-[48px] px-4 flex items-center justify-center shrink-0 border border-gray-200 rounded-xl bg-gray-50 transition ${isUploading || isTyping ? 'animate-pulse opacity-50 pointer-events-none' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
              title="Upload document for Summarization"
            >
              <UploadCloud size={20} />
            </label>
            
            <div className="flex-1 relative">
              <textarea
                className="w-full min-h-[48px] h-[48px] bg-gray-50 border border-gray-200 rounded-xl resize-none py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-gray-800 placeholder-gray-400"
                placeholder="Ask anything or upload a document to summarize..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isUploading}
              />
            </div>
            
            <button 
              className="h-[48px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 shadow-sm transition-colors font-medium gap-2"
              onClick={handleSend}
              disabled={(!inputValue.trim() && !activeFileName) || isTyping || isUploading}
            >
              <span>Send</span>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
