import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embedModel = genAI.getGenerativeModel({
  model: 'models/gemini-embedding-001'
});

export async function getQueryEmbedding(text) {
  const result = await embedModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });
  return result.embedding.values;
}

export async function searchSimilarChunks(queryEmbedding, limit = 4, threshold = 0.45, filterCategory = null) {
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_category: filterCategory
  });

  if (error) {
    console.error('Vector search error:', error);
    return [];
  }

  return data || [];
}