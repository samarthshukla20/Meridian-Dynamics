import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildPrompt } from '../rag/prompts.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateChatResponse(userQuery, contextChunks) {
  const model = genAI.getGenerativeModel({
    model: 'models/gemini-3.1-flash-lite',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,       // Keeps answers focused and strictly factual
      maxOutputTokens: 500    // Cuts off rambling, speeds up response completion
    }
  });

  const prompt = buildPrompt(userQuery, contextChunks);
  const result = await model.generateContent(prompt);
  return result.response.text();
}