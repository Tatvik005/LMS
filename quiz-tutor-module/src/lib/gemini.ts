import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for the API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateTutorResponse = async (prompt: string, contextText?: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let fullPrompt = `You are a helpful, expert AI Teaching Assistant. Format your response beautifully using markdown (bullet points, bold text, code blocks if necessary). `;
    
    if (contextText) {
      fullPrompt += `\n\nHere is the study material context from the user:\n${contextText}\n\n`;
    }
    
    fullPrompt += `\n\nUser request: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
};
