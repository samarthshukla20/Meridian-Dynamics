import express from 'express';
import { getQueryEmbedding, searchSimilarChunks } from '../services/vectorSearch.js';
import { generateChatResponse } from '../services/llmService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    // 1. Generate 768-dim query embedding
    const queryEmbedding = await getQueryEmbedding(message);

    // 2. Query Supabase vector similarity
    const chunks = await searchSimilarChunks(queryEmbedding, 4, 0.4);

    if (!chunks.length) {
      return res.json({
        reply: "I'm not completely certain about that specific detail. You can reach out directly to the Meridian Dynamics team for custom inquiries!"
      });
    }

    // 3. Generate response using retrieved context
    const reply = await generateChatResponse(message, chunks);

    return res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error while processing message.' });
  }
});

export default router;