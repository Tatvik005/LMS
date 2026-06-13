import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for the API key to ensure security
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface FileData {
  mimeType: string;
  data: string;
}

export const generateTutorResponse = async (prompt: string, chatHistory?: any[], fileData?: FileData): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let fullPrompt = `You are a helpful, expert AI Teaching Assistant. Format your response beautifully using markdown (bullet points, bold text, code blocks if necessary). `;
    
    if (chatHistory && chatHistory.length > 1) {
      fullPrompt += `\n\nHere is the recent conversation history for context:\n`;
      const recentHistory = chatHistory.slice(-6);
      for (const msg of recentHistory) {
        if (msg.id !== 'welcome') {
          fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      }
    }
    
    fullPrompt += `\n\nUser request: ${prompt}`;
    
    const parts: any[] = [fullPrompt];
    
    if (fileData) {
      parts.push({
        inlineData: {
          data: fileData.data,
          mimeType: fileData.mimeType
        }
      });
    }
    
    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return `I'm sorry, I encountered an error: ${error.message || 'Unknown error'}`;
  }
};
